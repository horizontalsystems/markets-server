WITH supported_tokens AS (
  SELECT *
  FROM UNNEST(@supported_tokens)
),
volume_entry_eth AS (
  SELECT
    to_address AS address,
    value,
    block_timestamp
  FROM `bigquery-public-data.crypto_ethereum.transactions`
  WHERE to_address IS NOT NULL

  UNION ALL
  SELECT
    from_address AS address,
    value,
    block_timestamp
  FROM `bigquery-public-data.crypto_ethereum.transactions`
  WHERE from_address IS NOT NULL
),
volume_entry_tokens AS (
  SELECT
    to_address AS address,
    safe_cast(value AS FLOAT64) AS value,
    block_timestamp,
    token_address
  FROM `bigquery-public-data.crypto_ethereum.token_transfers`
  UNION ALL
  SELECT
    from_address AS address,
    safe_cast(value AS FLOAT64) * -1 AS value,
    block_timestamp,
    token_address
  FROM `bigquery-public-data.crypto_ethereum.token_transfers`
),
volume_entry AS (
  SELECT
    address,
    value/POWER(10, 18) AS value,
    block_timestamp,
    'ethereum' AS coin_address
  FROM volume_entry_eth
  UNION ALL
  SELECT
    volume_entry_tokens.address,
    value/(POWER(10, tokens.decimals)) AS value,
    block_timestamp,
    token_address AS coin_address
  FROM supported_tokens AS tokens
    LEFT JOIN volume_entry_tokens
    ON tokens.address = volume_entry_tokens.token_address
),
stats_entry AS (
  SELECT
    coin_address, address, SUM(ABS(value))/2 AS volume
  FROM volume_entry
  WHERE block_timestamp >= @from_date
  GROUP BY coin_address, address
),
rank_entry AS (
  SELECT
      coin_address, address, volume,
      ROW_NUMBER() OVER(PARTITION BY coin_address ORDER BY volume DESC) AS volume_rank
  FROM stats_entry
)

SELECT *
FROM rank_entry
WHERE volume_rank <= @addresses_per_coin
ORDER BY coin_address DESC

