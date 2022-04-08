WITH
-- BTC --
btc_txs AS (
  SELECT 'bitcoin' as platform, 8 as decimals, output_value, block_timestamp, block_timestamp_month as partition_date
  FROM `bigquery-public-data.crypto_bitcoin.transactions`
),
-- BCH --
bch_txs AS (
  SELECT 'bitcoin-cash' as platform, 8 as decimals, output_value, block_timestamp, block_timestamp_month as partition_date
  FROM `bigquery-public-data.crypto_bitcoin_cash.transactions`
),
-- DASH --
dash_txs AS (
  SELECT 'dash' as platform, 8 as decimals, output_value, block_timestamp, block_timestamp_month as partition_date
  FROM `bigquery-public-data.crypto_dash.transactions`
),
-- DOGE --
doge_txs AS (
  SELECT 'dogecoin' as platform, 8 as decimals, output_value, block_timestamp, block_timestamp_month as partition_date
  FROM `bigquery-public-data.crypto_dogecoin.transactions`
),
-- LTC --
ltc_txs AS (
  SELECT 'litecoin' as platform,  8 as decimals, output_value, block_timestamp, block_timestamp_month as partition_date
  FROM `bigquery-public-data.crypto_litecoin.transactions`
),
-- ZCASH --
zcash_txs AS (
  SELECT 'zcash' as platform, 8 as decimals, output_value, block_timestamp, block_timestamp_month as partition_date
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
  CASE @period
    WHEN '30m' THEN TIMESTAMP_SECONDS(30*60 * DIV(UNIX_SECONDS(block_timestamp), 30*60))
    WHEN '1h' THEN TIMESTAMP_TRUNC(block_timestamp, HOUR)
    WHEN '1d' THEN TIMESTAMP_TRUNC(block_timestamp, DAY)
  END as date,
  platform,
  sum(output_value/(POWER(10, decimals))) as volume,
  COUNT(1) as count
FROM txs_entry
WHERE
  partition_date >= @date_partition AND
  block_timestamp >= @date_from AND
  block_timestamp < @date_to
GROUP BY
  platform, date
ORDER BY
  platform, date ASC
