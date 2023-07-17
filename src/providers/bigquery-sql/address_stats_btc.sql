WITH
  btc_inputs AS (
  SELECT
    'bitcoin' AS platform,
    transactions.block_timestamp,
    transactions.block_timestamp_month AS partition_date,
    inputs.addresses,
    inputs.type
  FROM
    `bigquery-public-data.crypto_bitcoin.transactions` AS transactions,
    transactions.inputs AS inputs ),
  btc_outputs AS (
  SELECT
    'bitcoin' AS platform,
    transactions.block_timestamp,
    transactions.block_timestamp_month AS partition_date,
    outputs.addresses,
    outputs.type
  FROM
    `bigquery-public-data.crypto_bitcoin.transactions` AS transactions,
    transactions.outputs AS outputs ),
  bch_inputs AS (
  SELECT
    'bitcoin-cash' AS platform,
    transactions.block_timestamp,
    transactions.block_timestamp_month AS partition_date,
    inputs.addresses,
    inputs.type
  FROM
    `bigquery-public-data.crypto_bitcoin_cash.transactions` AS transactions,
    transactions.inputs AS inputs ),
  bch_outputs AS (
  SELECT
    'bitcoin-cash' AS platform,
    transactions.block_timestamp,
    transactions.block_timestamp_month AS partition_date,
    outputs.addresses,
    outputs.type
  FROM
    `bigquery-public-data.crypto_bitcoin_cash.transactions` AS transactions,
    transactions.outputs AS outputs ),
  dash_inputs AS (
  SELECT
    'dash' AS platform,
    transactions.block_timestamp,
    transactions.block_timestamp_month AS partition_date,
    inputs.addresses,
    inputs.type
  FROM
    `bigquery-public-data.crypto_dash.transactions` AS transactions,
    transactions.inputs AS inputs ),
  dash_outputs AS (
  SELECT
    'dash' AS platform,
    transactions.block_timestamp,
    transactions.block_timestamp_month AS partition_date,
    outputs.addresses,
    outputs.type
  FROM
    `bigquery-public-data.crypto_dash.transactions` AS transactions,
    transactions.outputs AS outputs ),
  doge_inputs AS (
  SELECT
    'dogecoin' AS platform,
    transactions.block_timestamp,
    transactions.block_timestamp_month AS partition_date,
    inputs.addresses,
    inputs.type
  FROM
    `bigquery-public-data.crypto_dogecoin.transactions` AS transactions,
    transactions.inputs AS inputs ),
  doge_outputs AS (
  SELECT
    'dogecoin' AS platform,
    transactions.block_timestamp,
    transactions.block_timestamp_month AS partition_date,
    outputs.addresses,
    outputs.type
  FROM
    `bigquery-public-data.crypto_dogecoin.transactions` AS transactions,
    transactions.outputs AS outputs ),
  ltc_inputs AS (
  SELECT
    'litecoin' AS platform,
    transactions.block_timestamp,
    transactions.block_timestamp_month AS partition_date,
    inputs.addresses,
    inputs.type
  FROM
    `bigquery-public-data.crypto_litecoin.transactions` AS transactions,
    transactions.inputs AS inputs ),
  ltc_outputs AS (
  SELECT
    'litecoin' AS platform,
    transactions.block_timestamp,
    transactions.block_timestamp_month AS partition_date,
    outputs.addresses,
    outputs.type
  FROM
    `bigquery-public-data.crypto_litecoin.transactions` AS transactions,
    transactions.outputs AS outputs ),
  zcash_inputs AS (
  SELECT
    'zcash' AS platform,
    transactions.block_timestamp,
    transactions.block_timestamp_month AS partition_date,
    inputs.addresses,
    inputs.type
  FROM
    `bigquery-public-data.crypto_zcash.transactions` AS transactions,
    transactions.inputs AS inputs ),
  zcash_outputs AS (
  SELECT
    'zcash' AS platform,
    transactions.block_timestamp,
    transactions.block_timestamp_month AS partition_date,
    outputs.addresses,
    outputs.type
  FROM
    `bigquery-public-data.crypto_zcash.transactions` AS transactions,
    transactions.outputs AS outputs ),
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
    SELECT * FROM entry_1d
    WHERE block_date >= @date_from
  )
  SELECT * from entries
  WHERE partition_date >= @date_partition
  ORDER BY period, block_date
