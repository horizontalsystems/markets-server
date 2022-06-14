SELECT
  number,
  `hash`,
  'bitcoin' as chain
FROM `bigquery-public-data.crypto_bitcoin.blocks`
WHERE timestamp_month >= @date_from
  AND timestamp_month <= @date_to
union all
SELECT
  number,
  `hash`,
  'bitcoin-cash' as chain
FROM `bigquery-public-data.crypto_bitcoin_cash.blocks`
WHERE timestamp_month >= @date_from
  AND timestamp_month <= @date_to
