WITH
supported_tokens AS (
  SELECT *
  FROM UNNEST(@supported_tokens)
),
entry_ethereum AS (
  SELECT
    to_address AS address,
    block_timestamp
  FROM `bigquery-public-data.crypto_ethereum.transactions`
  WHERE to_address IS NOT NULL
  UNION ALL
  SELECT
    from_address AS address,
    block_timestamp
  FROM `bigquery-public-data.crypto_ethereum.transactions`
  WHERE from_address IS NOT NULL
),
entry_tokens AS (
  SELECT
    to_address AS address,
    block_timestamp,
    token_address
  FROM `bigquery-public-data.crypto_ethereum.token_transfers`
  UNION ALL
  SELECT
    from_address AS address,
    block_timestamp,
    token_address
  FROM `bigquery-public-data.crypto_ethereum.token_transfers`
  WHERE from_address IS NOT NULL
),
entry_union AS (
  SELECT
    address,
    block_timestamp,
    'ethereum' AS platform
  FROM entry_ethereum
  UNION ALL
  SELECT
    entry_tokens.address,
    block_timestamp,
    token_address AS platform
  FROM supported_tokens AS tokens
    LEFT JOIN entry_tokens
       ON tokens.address = entry_tokens.token_address
),
addresses_entry AS (
  SELECT * FROM entry_union
  WHERE block_timestamp >= @date_from
),
entry_30m AS(

 SELECT
    platform,
    '30m' as period,
    TIMESTAMP_SECONDS(30*60 * DIV(UNIX_SECONDS(block_timestamp), 30*60)) AS block_date,
    COUNT(DISTINCT address) AS address_count
  FROM addresses_entry
  GROUP BY platform, period, block_date
),
entry_4h AS(

  SELECT
    platform,
    '4h' as period,
    TIMESTAMP_SECONDS(4*60*60 * DIV(UNIX_SECONDS(block_timestamp), 4*60*60)) AS block_date,
    COUNT(DISTINCT address) AS address_count
  FROM addresses_entry
  GROUP BY platform, period, block_date
),
entry_8h AS(
  SELECT
    platform,
    '8h' as period,
    TIMESTAMP_SECONDS(8*60*60 * DIV(UNIX_SECONDS(block_timestamp), 8*60*60)) AS block_date,
    COUNT(DISTINCT address) AS address_count
  FROM addresses_entry
  GROUP BY platform, period, block_date
),
entry_1d AS(

  SELECT
    platform,
    '1d' as period,
    TIMESTAMP_TRUNC(block_timestamp, DAY) AS block_date,
    COUNT(DISTINCT address) AS address_count
  FROM addresses_entry
  GROUP BY platform, period, block_date
),
entries AS (
  SELECT * FROM entry_30m
  WHERE block_date >= TIMESTAMP(greatest(DATE_SUB(CURRENT_DATETIME(), INTERVAL 1 DAY), @date_from))
  UNION ALL
  SELECT * FROM entry_4h
  WHERE block_date >= TIMESTAMP(greatest(DATE_SUB(CURRENT_DATETIME(), INTERVAL 15 DAY), @date_from))
  UNION ALL
  SELECT * FROM entry_8h
  WHERE block_date >= TIMESTAMP(greatest(DATE_SUB(CURRENT_DATETIME(), INTERVAL 15 DAY), @date_from))
  UNION ALL
  SELECT * FROM entry_1d
  WHERE block_date >= @date_from
)
SELECT *
FROM entries
ORDER BY
  platform DESC,
  block_date ASC
