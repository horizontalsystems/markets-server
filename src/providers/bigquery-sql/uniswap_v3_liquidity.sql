with supported_tokens AS (
  SELECT * FROM UNNEST(@supported_tokens)
),
burning AS (
  SELECT
    token0, token1, pool,
    SUM (cast(B.amount0 AS BIGNUMERIC)) sum0,
    SUM (cast(B.amount1 AS BIGNUMERIC)) sum1
  FROM
    blockchain-etl.ethereum_uniswap.UniswapV3Pool_event_Burn B,
    blockchain-etl.ethereum_uniswap.UniswapV3Factory_event_PoolCreated P
  WHERE B.contract_address = P.pool
    AND B.block_timestamp >= @date_from
    AND B.block_timestamp < @date_to
  GROUP BY token0, token1, pool
),
minting AS (
  SELECT
    token0, token1, pool,
    SUM (cast(M.amount0 AS BIGNUMERIC)) sum0,
    SUM (cast(M.amount1 AS BIGNUMERIC)) sum1
  FROM
    blockchain-etl.ethereum_uniswap.UniswapV3Pool_event_Mint M,
    blockchain-etl.ethereum_uniswap.UniswapV3Factory_event_PoolCreated P
  WHERE M.contract_address = P.pool
    AND M.block_timestamp >= @date_from
    AND M.block_timestamp < @date_to
  GROUP BY token0, token1, pool
),
swapping AS (
  SELECT
    token0, token1, pool,
    SUM (cast(S.amount0 AS BIGNUMERIC)) sum0,
    SUM (cast(S.amount1 AS BIGNUMERIC)) sum1
  FROM
    blockchain-etl.ethereum_uniswap.UniswapV3Pool_event_Swap S,
    blockchain-etl.ethereum_uniswap.UniswapV3Factory_event_PoolCreated P
  WHERE S.contract_address = P.pool
    AND S.block_timestamp >= @date_from
    AND S.block_timestamp < @date_to
  GROUP BY token0, token1, pool
),
amounts AS (
  SELECT
    M.token0, M.token1,
    (M.sum0-B.sum0+S.sum0) AS sum0,
    (M.sum1-B.sum1+S.sum1) AS sum1
  FROM burning B, minting M, swapping S
  WHERE B.pool = M.pool
    AND M.pool = S.pool
),
v3 AS (
  SELECT sum0 AS amount, token0 AS token
  FROM amounts
  UNION ALL
  SELECT sum1 AS amount, token1 AS token
  FROM amounts
)
SELECT
  token as address,
  SUM (amount)/pow(10, T.decimals) AS volume,
  TIMESTAMP_SUB(timestamp(@date_to), INTERVAL 1 DAY) as date
FROM
  v3,
  supported_tokens T
WHERE v3.token = T.address
GROUP BY token, date, T.decimals
