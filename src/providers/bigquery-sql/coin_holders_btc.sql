WITH

inputs AS (
SELECT
    transactions.block_timestamp,
    transactions.block_timestamp_month as partition_date,
    inputs.addresses,
    inputs.type,
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
    outputs.type,
    outputs.value
FROM `bigquery-public-data.crypto_bitcoin.transactions` AS transactions,
    transactions.outputs as outputs
WHERE outputs.value > 0
),
balance_entry AS (
   -- debits
   SELECT block_timestamp, partition_date, array_to_string(inputs.addresses, ",") AS address,
        inputs.type as type,  -inputs.value AS value
   FROM inputs
   UNION ALL
   -- credits
   SELECT block_timestamp, partition_date, array_to_string(outputs.addresses, ",") AS address,
        outputs.type as type, outputs.value AS value
   FROM outputs
)
SELECT *,
(balance / 210000) as percentage
FROM
(
    SELECT
        address,
        sum(value * 0.00000001) as balance
    FROM balance_entry
    GROUP BY address, type
    ORDER BY balance DESC
    LIMIT @addresses_per_coin
)
