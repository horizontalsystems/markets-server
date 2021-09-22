SELECT
  date(block_timestamp) AS date,
  count(1) AS count,
  sum(value) / POWER(10, 18) AS volume
FROM  `bigquery-public-data.crypto_ethereum.transactions`
WHERE block_timestamp >= @from_date
GROUP BY date
ORDER BY date ASC