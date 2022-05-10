with transfers AS (
  SELECT
    to_address AS address,
    1 AS value,
    block_timestamp,
    token_address
  FROM `bigquery-public-data.crypto_ethereum.token_transfers`
  UNION ALL
  SELECT
    from_address AS address,
    -1 AS value,
    block_timestamp,
    token_address
  FROM `bigquery-public-data.crypto_ethereum.token_transfers`
),
holders AS (
  select
    address,
    SUM(value) AS quantity
  FROM transfers
  WHERE block_timestamp >= @date_from
    AND token_address = @contract
  GROUP BY address
)
SELECT
  address,
  quantity
FROM holders
WHERE quantity > 0
