WITH
-- BTC --
btc_inputs AS (
  SELECT 'bitcoin' as platform, 8 as decimals, 21000000 as total_supply, transactions.block_timestamp,transactions.block_timestamp_month as partition_date,
        inputs.addresses, inputs.type,inputs.value
  FROM `bigquery-public-data.crypto_bitcoin.transactions` as transactions, transactions.inputs as inputs
),
btc_outputs AS (
  SELECT 'bitcoin' as platform, 8 as decimals, 21000000 as total_supply, transactions.block_timestamp, transactions.block_timestamp_month  as partition_date,
        outputs.addresses, outputs.type, outputs.value
  FROM `bigquery-public-data.crypto_bitcoin.transactions` AS transactions,transactions.outputs as outputs
),
-- BCH --
bch_inputs AS (
  SELECT 'bitcoin-cash' as platform, 8 as decimals, 21000000 as total_supply, transactions.block_timestamp,transactions.block_timestamp_month as partition_date,
        inputs.addresses, inputs.type,inputs.value
  FROM `bigquery-public-data.crypto_bitcoin_cash.transactions` as transactions, transactions.inputs as inputs
),
bch_outputs AS (
  SELECT 'bitcoin-cash' as platform, 8 as decimals, 21000000 as total_supply, transactions.block_timestamp, transactions.block_timestamp_month  as partition_date,
        outputs.addresses, outputs.type, outputs.value
  FROM `bigquery-public-data.crypto_bitcoin_cash.transactions` AS transactions,transactions.outputs as outputs
),
-- DASH --
dash_inputs AS (
  SELECT 'dash' as platform, 8 as decimals, 18920000 as total_supply, transactions.block_timestamp,transactions.block_timestamp_month as partition_date,
      inputs.addresses,inputs.type,inputs.value
  FROM `bigquery-public-data.crypto_dash.transactions` as transactions,transactions.inputs as inputs
),
dash_outputs AS (
  SELECT 'dash' as platform, 8 as decimals, 18920000 as total_supply, transactions.block_timestamp, transactions.block_timestamp_month  as partition_date,
  outputs.addresses, outputs.type, outputs.value
FROM `bigquery-public-data.crypto_dash.transactions` AS transactions, transactions.outputs as outputs
),
-- DOGE --
doge_inputs AS (
  SELECT 'dogecoin' as platform, 8 as decimals, 132670764299 as total_supply, transactions.block_timestamp,transactions.block_timestamp_month as partition_date,
      inputs.addresses,inputs.type,inputs.value
  FROM `bigquery-public-data.crypto_dogecoin.transactions` as transactions,transactions.inputs as inputs
),
doge_outputs AS (
  SELECT 'dogecoin' as platform, 8 as decimals, 132670764299 as total_supply, transactions.block_timestamp, transactions.block_timestamp_month  as partition_date,
  outputs.addresses, outputs.type, outputs.value
FROM `bigquery-public-data.crypto_dogecoin.transactions` AS transactions, transactions.outputs as outputs
),
-- LTC --
ltc_inputs AS (
  SELECT 'litecoin' as platform,  8 as decimals, 84000000 as total_supply, transactions.block_timestamp,transactions.block_timestamp_month as partition_date,
      inputs.addresses,inputs.type,inputs.value
  FROM `bigquery-public-data.crypto_litecoin.transactions` as transactions,transactions.inputs as inputs
),
ltc_outputs AS (
  SELECT 'litecoin' as platform, 8 as decimals, 84000000 as total_supply, transactions.block_timestamp, transactions.block_timestamp_month  as partition_date,
  outputs.addresses, outputs.type, outputs.value
FROM `bigquery-public-data.crypto_litecoin.transactions` AS transactions, transactions.outputs as outputs
),
-- ZCASH --
zcash_inputs AS (
  SELECT 'zcash' as platform, 8 as decimals, 21000000 as total_supply, transactions.block_timestamp,transactions.block_timestamp_month as partition_date,
      inputs.addresses,inputs.type,inputs.value
  FROM `bigquery-public-data.crypto_zcash.transactions` as transactions,transactions.inputs as inputs
),
zcash_outputs AS (
  SELECT 'zcash' as platform, 8 as decimals, 21000000 as total_supply, transactions.block_timestamp, transactions.block_timestamp_month  as partition_date,
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

balance_entry AS (
   -- debits
   SELECT platform, decimals, total_supply, block_timestamp, partition_date, array_to_string(inputs.addresses, ",") AS address,
        inputs.type as type,  -inputs.value AS value
   FROM inputs
   UNION ALL
   -- credits
   SELECT platform,decimals, total_supply, block_timestamp, partition_date, array_to_string(outputs.addresses, ",") AS address,
        outputs.type as type, outputs.value AS value
   FROM outputs
),
stats_entry AS (
  SELECT *, ((balance * 100) / total_supply) as percentage
  FROM
  (
    SELECT platform, total_supply, address, sum(value/(POWER(10, decimals))) as balance
    FROM balance_entry
    -- WHERE partition_date >= '2022-04-01'
    GROUP BY platform, address, type, total_supply
    ORDER BY balance DESC
  )
),
rank_entry AS (
  SELECT
      platform, address, balance, percentage,
      ROW_NUMBER() OVER(PARTITION BY platform ORDER BY balance DESC) AS balance_rank
  FROM stats_entry
)

SELECT *
FROM rank_entry
WHERE balance_rank <=  @addresses_per_coin
ORDER BY platform DESC
