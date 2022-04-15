WITH
-- BTC --
btc_inputs AS (
  SELECT 'bitcoin' as platform, transactions.block_timestamp,transactions.block_timestamp_month as partition_date,
        inputs.addresses, inputs.type
  FROM `bigquery-public-data.crypto_bitcoin.transactions` as transactions, transactions.inputs as inputs
),
btc_outputs AS (
  SELECT 'bitcoin' as platform, transactions.block_timestamp, transactions.block_timestamp_month  as partition_date,
        outputs.addresses, outputs.type
  FROM `bigquery-public-data.crypto_bitcoin.transactions` AS transactions,transactions.outputs as outputs
),
-- BCH --
bch_inputs AS (
  SELECT 'bitcoin-cash' as platform, transactions.block_timestamp,transactions.block_timestamp_month as partition_date,
        inputs.addresses, inputs.type
  FROM `bigquery-public-data.crypto_bitcoin_cash.transactions` as transactions, transactions.inputs as inputs
),
bch_outputs AS (
  SELECT 'bitcoin-cash' as platform, transactions.block_timestamp, transactions.block_timestamp_month  as partition_date,
        outputs.addresses, outputs.type
  FROM `bigquery-public-data.crypto_bitcoin_cash.transactions` AS transactions,transactions.outputs as outputs
),
-- DASH --
dash_inputs AS (
  SELECT 'dash' as platform, transactions.block_timestamp,transactions.block_timestamp_month as partition_date,
      inputs.addresses,inputs.type
  FROM `bigquery-public-data.crypto_dash.transactions` as transactions,transactions.inputs as inputs
),
dash_outputs AS (
  SELECT 'dash' as platform, transactions.block_timestamp, transactions.block_timestamp_month  as partition_date,
  outputs.addresses, outputs.type
FROM `bigquery-public-data.crypto_dash.transactions` AS transactions, transactions.outputs as outputs
),
-- DOGE --
doge_inputs AS (
  SELECT 'dogecoin' as platform, transactions.block_timestamp,transactions.block_timestamp_month as partition_date,
      inputs.addresses,inputs.type
  FROM `bigquery-public-data.crypto_dogecoin.transactions` as transactions,transactions.inputs as inputs
),
doge_outputs AS (
  SELECT 'dogecoin' as platform, transactions.block_timestamp, transactions.block_timestamp_month  as partition_date,
  outputs.addresses, outputs.type
FROM `bigquery-public-data.crypto_dogecoin.transactions` AS transactions, transactions.outputs as outputs
),
-- LTC --
ltc_inputs AS (
  SELECT 'litecoin' as platform, transactions.block_timestamp,transactions.block_timestamp_month as partition_date,
      inputs.addresses,inputs.type
  FROM `bigquery-public-data.crypto_litecoin.transactions` as transactions,transactions.inputs as inputs
),
ltc_outputs AS (
  SELECT 'litecoin' as platform, transactions.block_timestamp, transactions.block_timestamp_month  as partition_date,
  outputs.addresses, outputs.type
FROM `bigquery-public-data.crypto_litecoin.transactions` AS transactions, transactions.outputs as outputs
),
-- ZCASH --
zcash_inputs AS (
  SELECT 'zcash' as platform, transactions.block_timestamp,transactions.block_timestamp_month as partition_date,
      inputs.addresses,inputs.type
  FROM `bigquery-public-data.crypto_zcash.transactions` as transactions,transactions.inputs as inputs
),
zcash_outputs AS (
  SELECT 'zcash' as platform, transactions.block_timestamp, transactions.block_timestamp_month  as partition_date,
  outputs.addresses, outputs.type
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
   SELECT platform, block_timestamp, partition_date, array_to_string(inputs.addresses, ",") AS address
   FROM inputs
   UNION ALL
   SELECT platform, block_timestamp, partition_date, array_to_string(outputs.addresses, ",") AS address
   FROM outputs
),
entry_30m AS(
 SELECT
    platform,
    '30m' as period,
    TIMESTAMP_SECONDS(30*60 * DIV(UNIX_SECONDS(block_timestamp), 30*60)) AS block_date,
    COUNT(DISTINCT address) AS address_count,
    partition_date
  FROM addresses_entry
  GROUP BY platform, period, partition_date , block_date
),
entry_4h AS(
  SELECT
    platform,
    '4h' as period,
    TIMESTAMP_SECONDS(4*60*60 * DIV(UNIX_SECONDS(block_timestamp), 4*60*60)) AS block_date,
    COUNT(DISTINCT address) AS address_count,
    partition_date
  FROM addresses_entry
  GROUP BY platform, period, partition_date , block_date
),
entry_8h AS(
  SELECT
    platform,
    '8h' as period,
    TIMESTAMP_SECONDS(8*60*60 * DIV(UNIX_SECONDS(block_timestamp), 8*60*60)) AS block_date,
    COUNT(DISTINCT address) AS address_count,
    partition_date
  FROM addresses_entry
  GROUP BY platform, period, partition_date , block_date
),
entry_1d AS(
  SELECT
    platform,
    '1d' as period,
    TIMESTAMP_TRUNC(block_timestamp, DAY) AS block_date,
    COUNT(DISTINCT address) AS address_count,
    partition_date
  FROM addresses_entry
  GROUP BY platform, period, partition_date , block_date
),
entries AS (
  SELECT * FROM entry_30m
  WHERE block_date >= TIMESTAMP(greatest(DATE_SUB(CURRENT_DATETIME(), INTERVAL 1 DAY), @date_from))
  UNION ALL
  SELECT * FROM entry_4h
  WHERE block_date >= TIMESTAMP(greatest(DATE_SUB(CURRENT_DATETIME(), INTERVAL 8 DAY), @date_from))
  UNION ALL
  SELECT * FROM entry_8h
  WHERE block_date >= TIMESTAMP(greatest(DATE_SUB(CURRENT_DATETIME(), INTERVAL 15 DAY), @date_from))
  UNION ALL
  SELECT * FROM entry_1d
  WHERE block_date >= @date_from
)

SELECT * from entries
WHERE partition_date >= @date_partition
ORDER BY period, block_date

