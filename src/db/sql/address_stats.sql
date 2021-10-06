WITH
supported_tokens AS (
  SELECT *
  FROM UNNEST(@supported_tokens)
),
volume_entry_eth AS (
  SELECT
    to_address AS address,
    value,
    block_timestamp
  FROM `bigquery-public-data.crypto_ethereum.transactions`
  WHERE to_address IS NOT NULL

  UNION ALL
  SELECT
    from_address AS address,
    value,
    block_timestamp
  FROM `bigquery-public-data.crypto_ethereum.transactions`
  WHERE from_address IS NOT NULL

),
volume_entry_tokens AS (
  SELECT
    to_address AS address,
    safe_cast(value AS FLOAT64) AS value,
    block_timestamp,
    token_address
  FROM `bigquery-public-data.crypto_ethereum.token_transfers`
  UNION ALL
  SELECT
    from_address AS address,
    safe_cast(value AS FLOAT64) * -1 AS value,
    block_timestamp,
    token_address
  FROM `bigquery-public-data.crypto_ethereum.token_transfers`
),
volume_entry AS (
  SELECT
    address, value/POWER(10, 18) AS value, block_timestamp, 'ethereum' AS coin_address
  FROM volume_entry_eth
  UNION ALL
  SELECT
    volume_entry_tokens.address, value/(POWER(10, tokens.decimals)) AS value, block_timestamp, token_address AS coin_address
  FROM supported_tokens AS tokens
    LEFT JOIN volume_entry_tokens
       ON tokens.address = volume_entry_tokens.token_address
)

SELECT
  coin_address,
  CASE @period
    WHEN '1h' THEN TIMESTAMP_TRUNC(block_timestamp, HOUR)
    WHEN '4h' THEN TIMESTAMP_SECONDS(4*60*60 * DIV(UNIX_SECONDS(block_timestamp), 4*60*60))
    WHEN '1d' THEN TIMESTAMP_TRUNC(block_timestamp, DAY)
  END as block_date,
  COUNT(DISTINCT address) as address_count,
  SUM(ABS(value))/2 AS volume
FROM volume_entry
WHERE
  block_timestamp >= @from_date AND
  block_timestamp < @to_date
GROUP BY
  coin_address,
  block_date
ORDER BY
  coin_address DESC,
  block_date ASC
