WITH supported_tokens AS (
  SELECT *
  FROM UNNEST(@supported_tokens)
),
balance_entry_eth AS (
  SELECT
    to_address AS address,
    value AS value,
    block_timestamp
  FROM `bigquery-public-data.crypto_ethereum.traces`
  WHERE to_address IS NOT NULL
    AND status = 1
    AND (call_type NOT IN ('delegatecall', 'callcode', 'staticcall') OR call_type IS NULL)

  UNION ALL

  SELECT
    from_address AS address,
    -value AS value,
   block_timestamp
  FROM `bigquery-public-data.crypto_ethereum.traces`
  WHERE from_address IS NOT NULL
    AND status = 1
    AND (call_type NOT IN ('delegatecall', 'callcode', 'staticcall') OR call_type IS NULL)

  UNION ALL

  SELECT
    miner AS address,
    SUM(CAST(receipt_gas_used AS numeric) * CAST((receipt_effective_gas_price - COALESCE(base_fee_per_gas, 0)) AS numeric)) AS value,
    block_timestamp
  FROM `bigquery-public-data.crypto_ethereum.transactions` AS transactions
  JOIN `bigquery-public-data.crypto_ethereum.blocks` AS blocks on blocks.number = transactions.block_number
  GROUP BY blocks.miner, block_timestamp

  UNION ALL

  SELECT
    from_address AS address,
    -(CAST(receipt_gas_used AS numeric) * CAST(receipt_effective_gas_price AS numeric)) AS value,
    block_timestamp
  FROM `bigquery-public-data.crypto_ethereum.transactions`
),
balance_entry_tokens AS (
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
balance_entry AS (
  SELECT
    address, value/POWER(10, 18) AS value,
    block_timestamp,
    'ethereum' AS coin_address
  FROM balance_entry_eth
  UNION ALL
  SELECT
    balance_entry_tokens.address,
    value/(POWER(10, tokens.decimals)) AS value,
    block_timestamp,
    token_address AS coin_address
  FROM supported_tokens AS tokens
    LEFT JOIN balance_entry_tokens
    ON tokens.address = balance_entry_tokens.token_address
),
stats_entry AS (
  SELECT
      coin_address, address, sum(value) AS balance,
  FROM balance_entry
  WHERE block_timestamp >= @from_date
  GROUP BY coin_address, address
),
rank_entry AS (
  SELECT
      coin_address, address, balance,
      ROW_NUMBER() OVER(PARTITION BY coin_address ORDER BY balance DESC) AS balance_rank
  FROM stats_entry
)

SELECT *
FROM rank_entry
WHERE balance_rank <= @addresses_per_coin
ORDER BY coin_address DESC

