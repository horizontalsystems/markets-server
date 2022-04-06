WITH
-- BTC --
btc_inputs AS (
  SELECT 'bitcoin' as platform, transactions.block_timestamp,transactions.block_timestamp_month as partition_date,
        inputs.addresses, inputs.type,inputs.value
  FROM `bigquery-public-data.crypto_bitcoin.transactions` as transactions, transactions.inputs as inputs
),
btc_outputs AS (
  SELECT 'bitcoin' as platform, transactions.block_timestamp, transactions.block_timestamp_month  as partition_date,
        outputs.addresses, outputs.type, outputs.value
  FROM `bigquery-public-data.crypto_bitcoin.transactions` AS transactions,transactions.outputs as outputs
),
-- BCH --
bch_inputs AS (
  SELECT 'bitcoin-cash' as platform, transactions.block_timestamp,transactions.block_timestamp_month as partition_date,
        inputs.addresses, inputs.type,inputs.value
  FROM `bigquery-public-data.crypto_bitcoin_cash.transactions` as transactions, transactions.inputs as inputs
),
bch_outputs AS (
  SELECT 'bitcoin-cash' as platform, transactions.block_timestamp, transactions.block_timestamp_month  as partition_date,
        outputs.addresses, outputs.type, outputs.value
  FROM `bigquery-public-data.crypto_bitcoin_cash.transactions` AS transactions,transactions.outputs as outputs
),
-- DASH --
dash_inputs AS (
  SELECT 'dash' as platform, transactions.block_timestamp,transactions.block_timestamp_month as partition_date,
      inputs.addresses,inputs.type,inputs.value
  FROM `bigquery-public-data.crypto_dash.transactions` as transactions,transactions.inputs as inputs
),
dash_outputs AS (
  SELECT 'dash' as platform, transactions.block_timestamp, transactions.block_timestamp_month  as partition_date,
  outputs.addresses, outputs.type, outputs.value
FROM `bigquery-public-data.crypto_dash.transactions` AS transactions, transactions.outputs as outputs
),
-- DOGE --
doge_inputs AS (
  SELECT 'dogecoin' as platform, transactions.block_timestamp,transactions.block_timestamp_month as partition_date,
      inputs.addresses,inputs.type,inputs.value
  FROM `bigquery-public-data.crypto_dogecoin.transactions` as transactions,transactions.inputs as inputs
),
doge_outputs AS (
  SELECT 'dogecoin' as platform, transactions.block_timestamp, transactions.block_timestamp_month  as partition_date,
  outputs.addresses, outputs.type, outputs.value
FROM `bigquery-public-data.crypto_dogecoin.transactions` AS transactions, transactions.outputs as outputs
),
-- LTC --
ltc_inputs AS (
  SELECT 'litecoin' as platform, transactions.block_timestamp,transactions.block_timestamp_month as partition_date,
      inputs.addresses,inputs.type,inputs.value
  FROM `bigquery-public-data.crypto_litecoin.transactions` as transactions,transactions.inputs as inputs
),
ltc_outputs AS (
  SELECT 'litecoin' as platform, transactions.block_timestamp, transactions.block_timestamp_month  as partition_date,
  outputs.addresses, outputs.type, outputs.value
FROM `bigquery-public-data.crypto_litecoin.transactions` AS transactions, transactions.outputs as outputs
),
-- ZCASH --
zcash_inputs AS (
  SELECT 'zcash' as platform, transactions.block_timestamp,transactions.block_timestamp_month as partition_date,
      inputs.addresses,inputs.type,inputs.value
  FROM `bigquery-public-data.crypto_zcash.transactions` as transactions,transactions.inputs as inputs
),
zcash_outputs AS (
  SELECT 'zcash' as platform, transactions.block_timestamp, transactions.block_timestamp_month  as partition_date,
  outputs.addresses, outputs.type, outputs.value
FROM `bigquery-public-data.crypto_zcash.transactions` AS transactions, transactions.outputs as outputs
),

inputs AS (
  SELECT * FROM btc_inputs
  UNION ALL
  SELECT * FROM bch_inputs
  UNION ALL
  SELECT * FROM dash_inputs
  UNION ALL
  SELECT * FROM doge_inputs
  UNION ALL
  SELECT * FROM ltc_inputs
  UNION ALL
  SELECT * FROM zcash_inputs
),
outputs AS (
  SELECT * FROM btc_outputs
  UNION ALL
  SELECT * FROM bch_outputs
  UNION ALL
  SELECT * FROM dash_outputs
  UNION ALL
  SELECT * FROM doge_outputs
  UNION ALL
  SELECT * FROM ltc_outputs
  UNION ALL
  SELECT * FROM zcash_outputs
),

addresses_entry AS (
   -- debits
   SELECT platform, block_timestamp, partition_date, array_to_string(inputs.addresses, ",") AS address
   FROM inputs
   UNION ALL
   -- credits
   SELECT platform, block_timestamp, partition_date, array_to_string(outputs.addresses, ",") AS address
   FROM outputs
)

SELECT
  CASE  '1d' -- @period
    WHEN '30m' THEN TIMESTAMP_SECONDS(30*60 * DIV(UNIX_SECONDS(block_timestamp), 30*60))
    WHEN '1h' THEN TIMESTAMP_TRUNC(block_timestamp, HOUR)
    WHEN '1d' THEN TIMESTAMP_TRUNC(block_timestamp, DAY)
  END as block_date,
  0 as volume,
  platform,
  COUNT(DISTINCT address) as address_count
FROM addresses_entry
WHERE
  -- partition_date = EXTRACT(DATE FROM DATETIME_TRUNC(@date_from, MONTH)) AND
  partition_date >= @date_partition AND
  block_timestamp >= @date_from AND
  block_timestamp < @date_to
GROUP BY
  platform, block_date
ORDER BY
  platform, block_date ASC