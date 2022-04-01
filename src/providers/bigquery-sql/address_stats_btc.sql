WITH
inputs AS (
SELECT
    transactions.block_timestamp,
    transactions.block_timestamp_month as partition_date,
    inputs.addresses,
    inputs.value
FROM `bigquery-public-data.crypto_bitcoin.transactions` as transactions,
    transactions.inputs as inputs
WHERE inputs.value > 0
),
outputs AS (
    SELECT
    transactions.block_timestamp,
    transactions.block_timestamp_month  as partition_date,
    outputs.addresses,
    outputs.value
FROM `bigquery-public-data.crypto_bitcoin.transactions` AS transactions,
    transactions.outputs as outputs
WHERE outputs.value > 0
),
addresses_entry AS (
   -- debits
   SELECT block_timestamp, partition_date, array_to_string(inputs.addresses, ",") AS address
   FROM inputs
   UNION ALL
   -- credits
   SELECT block_timestamp, partition_date, array_to_string(outputs.addresses, ",") AS address
   FROM outputs
)

SELECT
  CASE @period
    WHEN '30m' THEN TIMESTAMP_SECONDS(30*60 * DIV(UNIX_SECONDS(block_timestamp), 30*60))
    WHEN '1h' THEN TIMESTAMP_TRUNC(block_timestamp, HOUR)
    WHEN '1d' THEN TIMESTAMP_TRUNC(block_timestamp, DAY)
  END as block_date,
  0 as volume,
  'bitcoin' as coin_address,
  COUNT(DISTINCT address) as address_count
FROM addresses_entry
WHERE
  -- partition_date = EXTRACT(DATE FROM DATETIME_TRUNC(@date_from, MONTH)) AND
  partition_date = @date_partition AND
  block_timestamp >= @date_from AND
  block_timestamp < @date_to
GROUP BY
  block_date
ORDER BY
  block_date ASC
