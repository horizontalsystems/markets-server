WITH
supported_tokens as (
  SELECT *
  FROM UNNEST(@supported_tokens)
),
transactions as (
  SELECT
    block_timestamp,
    'ethereum' as address,
    value / POW(10,18) AS volume
  FROM `bigquery-public-data.crypto_ethereum.transactions`
  WHERE block_timestamp >= @dateFrom
    AND block_timestamp < @dateTo
  UNION ALL
  SELECT
    block_timestamp,
    token_address as address,
    SAFE_CAST(value AS BIGNUMERIC) / POW(10,decimals) as volume
    FROM `bigquery-public-data.crypto_ethereum.token_transfers`, supported_tokens tokens
   WHERE token_address = tokens.address
     AND block_timestamp >= @dateFrom
     AND block_timestamp < @dateTo
)
SELECT
  address,
  CASE @period
    WHEN '30m' THEN TIMESTAMP_SECONDS(30*60 * DIV(UNIX_SECONDS(block_timestamp), 30*60))
    WHEN '1h' THEN TIMESTAMP_TRUNC(block_timestamp, HOUR)
    ELSE TIMESTAMP_TRUNC(block_timestamp, DAY)
  END as date,
  SUM(ifnull(volume, 0)) as volume,
  COUNT(1) AS count
FROM transactions
GROUP BY address, date
ORDER BY date ASC
