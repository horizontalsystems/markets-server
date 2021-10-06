with supported_tokens as (
  SELECT * FROM UNNEST(@supported_tokens)
),
v3 as (
  SELECT
    S.*, P.token0, P.token1
  FROM
    blockchain-etl.ethereum_uniswap.UniswapV3Pool_event_Swap S,
    blockchain-etl.ethereum_uniswap.UniswapV3Factory_event_PoolCreated P
  WHERE S.contract_address = P.pool
    AND S.block_timestamp >= @dateFrom
    AND S.block_timestamp < @dateTo
),
swaps AS (
  SELECT
    block_timestamp,
    token0 AS token,
    SUM(abs(safe_cast(amount0 AS BIGNUMERIC)/pow(10, T.decimals))) AS amount
  FROM
    v3, supported_tokens AS T
  WHERE token0 = T.address
  GROUP BY token, block_timestamp
  UNION ALL
  SELECT
    block_timestamp,
    token1 AS token,
    SUM(abs(safe_cast(amount1 AS BIGNUMERIC) / POW(10, T.decimals))) AS amount
  FROM
    v3, supported_tokens AS T
  WHERE token1 = T.address
  GROUP BY token, block_timestamp
)
SELECT
  token as address,
  CASE @period
    WHEN '1h' THEN TIMESTAMP_TRUNC(block_timestamp, HOUR)
    WHEN '4h' THEN TIMESTAMP_SECONDS(4*60*60 * DIV(UNIX_SECONDS(block_timestamp), 4*60*60))
    ELSE TIMESTAMP_TRUNC(block_timestamp, DAY)
  END as date,
  SUM (amount) AS volume
FROM swaps
GROUP BY date, address
ORDER BY date
