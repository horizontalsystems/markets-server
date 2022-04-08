WITH
supported_tokens AS (
  SELECT *
  FROM UNNEST(@supported_tokens)
),
entry_ethereum AS (
  SELECT
    to_address AS address,
    block_timestamp
  FROM `bigquery-public-data.crypto_ethereum.transactions`
  WHERE to_address IS NOT NULL
  UNION ALL
  SELECT
    from_address AS address,
    block_timestamp
  FROM `bigquery-public-data.crypto_ethereum.transactions`
  WHERE from_address IS NOT NULL
),
entry_tokens AS (
  SELECT
    to_address AS address,
    block_timestamp,
    token_address
  FROM `bigquery-public-data.crypto_ethereum.token_transfers`
  UNION ALL
  SELECT
    from_address AS address,
    block_timestamp,
    token_address
  FROM `bigquery-public-data.crypto_ethereum.token_transfers`
),
volume_entry AS (
  SELECT
    address,
    block_timestamp,
    'ethereum' AS coin_address
  FROM entry_ethereum
  UNION ALL
  SELECT
    entry_tokens.address,
    block_timestamp,
    token_address AS coin_address
  FROM supported_tokens AS tokens
    LEFT JOIN entry_tokens
       ON tokens.address = entry_tokens.token_address
)

SELECT
  coin_address,
  COUNT(DISTINCT address) as address_count,
  CASE @period
    WHEN '30m' THEN TIMESTAMP_SECONDS(30*60 * DIV(UNIX_SECONDS(block_timestamp), 30*60))
    WHEN '1h' THEN TIMESTAMP_TRUNC(block_timestamp, HOUR)
    WHEN '1d' THEN TIMESTAMP_TRUNC(block_timestamp, DAY)
  END as block_date
FROM volume_entry
WHERE
  block_timestamp >= @date_from AND
  block_timestamp < @date_to
GROUP BY
  coin_address,
  block_date
ORDER BY
  coin_address DESC,
  block_date ASC
