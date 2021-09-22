WITH double_entry_book AS (
  SELECT
    to_address AS address,
    value AS value,
    DATE(block_timestamp) AS block_date
  FROM `bigquery-public-data.crypto_ethereum.traces`
  WHERE to_address IS NOT NULL
    AND status = 1
    AND (call_type NOT IN ('delegatecall', 'callcode', 'staticcall') OR call_type IS NULL)

  UNION ALL

  SELECT
    from_address AS address,
    -value AS value,
    DATE(block_timestamp) AS block_date
  FROM `bigquery-public-data.crypto_ethereum.traces`
  WHERE from_address IS NOT NULL
    AND status = 1
    AND (call_type NOT IN ('delegatecall', 'callcode', 'staticcall') OR call_type IS NULL)

  UNION ALL

  SELECT
    miner AS address,
    SUM(CAST(receipt_gas_used AS numeric) * CAST((receipt_effective_gas_price - COALESCE(base_fee_per_gas, 0)) AS numeric)) AS value,
    DATE(block_timestamp) AS date
  FROM `bigquery-public-data.crypto_ethereum.transactions` AS transactions
  JOIN `bigquery-public-data.crypto_ethereum.blocks` AS blocks on blocks.number = transactions.block_number
  GROUP BY blocks.miner, block_timestamp

  UNION ALL

  SELECT
    from_address AS address,
    -(CAST(receipt_gas_used AS numeric) * CAST(receipt_effective_gas_price AS numeric)) AS value,
    DATE(block_timestamp) AS block_date
  FROM `bigquery-public-data.crypto_ethereum.transactions`
)

SELECT block_date, count(distinct address), sum(value)/POWER(10, 18) AS volume
FROM double_entry_book
WHERE block_date >= @from_date
GROUP BY block_date
ORDER BY volume DESC
