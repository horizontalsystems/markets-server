WITH
btc_txs AS (
  SELECT 'bitcoin' as platform, output_value, block_timestamp, block_timestamp_month as partition_date
  FROM `bigquery-public-data.crypto_bitcoin.transactions`
),
bch_txs AS (
  SELECT 'bitcoin-cash' as platform, output_value, block_timestamp, block_timestamp_month as partition_date
  FROM `bigquery-public-data.crypto_bitcoin_cash.transactions`
),
dash_txs AS (
  SELECT 'dash' as platform, output_value, block_timestamp, block_timestamp_month as partition_date
  FROM `bigquery-public-data.crypto_dash.transactions`
),
doge_txs AS (
  SELECT 'dogecoin' as platform, output_value, block_timestamp, block_timestamp_month as partition_date
  FROM `bigquery-public-data.crypto_dogecoin.transactions`
),
ltc_txs AS (
  SELECT 'litecoin' as platform,  output_value, block_timestamp, block_timestamp_month as partition_date
  FROM `bigquery-public-data.crypto_litecoin.transactions`
),
zcash_txs AS (
  SELECT 'zcash' as platform, output_value, block_timestamp, block_timestamp_month as partition_date
  FROM `bigquery-public-data.crypto_zcash.transactions`
),

txs_entry AS (
  SELECT * FROM btc_txs
  UNION ALL
  SELECT * FROM bch_txs
  UNION ALL
  SELECT * FROM dash_txs
  UNION ALL
  SELECT * FROM doge_txs
  UNION ALL
  SELECT * FROM ltc_txs
  UNION ALL
  SELECT * FROM zcash_txs
)

SELECT
  COUNT(1) as count,
  platform as address,
  SUM(output_value/(POWER(10, 8))) as volume,
  CASE @period
    WHEN '30m' THEN TIMESTAMP_SECONDS(30*60 * DIV(UNIX_SECONDS(block_timestamp), 30*60))
    WHEN '1h' THEN TIMESTAMP_TRUNC(block_timestamp, HOUR)
    WHEN '1d' THEN TIMESTAMP_TRUNC(block_timestamp, DAY)
  END as date
FROM txs_entry
WHERE
  partition_date >= @date_partition AND
  block_timestamp >= @date_from AND
  block_timestamp < @date_to
GROUP BY address, date
ORDER BY address, date ASC
