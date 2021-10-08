with supported_tokens AS (
  SELECT * FROM UNNEST(@supported_tokens)
),
burning AS (
  SELECT
    token0, token1, pool,
    SUM (cast(B.amount0 AS BIGNUMERIC)) sum0,
    SUM (cast(B.amount1 AS BIGNUMERIC)) sum1,
    CASE @period
      WHEN '1h' THEN TIMESTAMP_TRUNC(B.block_timestamp, HOUR)
      WHEN '4h' THEN TIMESTAMP_SECONDS(4*60*60 * DIV(UNIX_SECONDS(B.block_timestamp), 4*60*60))
      WHEN '1d' THEN TIMESTAMP_TRUNC(B.block_timestamp, DAY)
    END as block_date
  FROM
    blockchain-etl.ethereum_uniswap.UniswapV3Pool_event_Burn B,
    blockchain-etl.ethereum_uniswap.UniswapV3Factory_event_PoolCreated P
  WHERE B.contract_address = P.pool
    AND B.block_timestamp >= @date_from
    AND B.block_timestamp < @date_to
  GROUP BY token0, token1, pool, block_date
),
minting AS (
  SELECT
    token0, token1, pool,
    SUM (cast(M.amount0 AS BIGNUMERIC)) sum0,
    SUM (cast(M.amount1 AS BIGNUMERIC)) sum1,
    CASE @period
      WHEN '1h' THEN TIMESTAMP_TRUNC(M.block_timestamp, HOUR)
      WHEN '4h' THEN TIMESTAMP_SECONDS(4*60*60 * DIV(UNIX_SECONDS(M.block_timestamp), 4*60*60))
      WHEN '1d' THEN TIMESTAMP_TRUNC(M.block_timestamp, DAY)
    END as block_date
  FROM
    blockchain-etl.ethereum_uniswap.UniswapV3Pool_event_Mint M,
    blockchain-etl.ethereum_uniswap.UniswapV3Factory_event_PoolCreated P
  WHERE M.contract_address = P.pool
    AND M.block_timestamp >= @date_from
    AND M.block_timestamp < @date_to
  GROUP BY token0, token1, pool, block_date
),
swapping AS (
  SELECT
    token0, token1, pool,
    SUM (cast(S.amount0 AS BIGNUMERIC)) sum0,
    SUM (cast(S.amount1 AS BIGNUMERIC)) sum1,
    CASE @period
      WHEN '1h' THEN TIMESTAMP_TRUNC(S.block_timestamp, HOUR)
      WHEN '4h' THEN TIMESTAMP_SECONDS(4*60*60 * DIV(UNIX_SECONDS(S.block_timestamp), 4*60*60))
      WHEN '1d' THEN TIMESTAMP_TRUNC(S.block_timestamp, DAY)
    END as block_date
  FROM
    blockchain-etl.ethereum_uniswap.UniswapV3Pool_event_Swap S,
    blockchain-etl.ethereum_uniswap.UniswapV3Factory_event_PoolCreated P
  WHERE S.contract_address = P.pool
    AND S.block_timestamp >= @date_from
    AND S.block_timestamp < @date_to
  GROUP BY token0, token1, pool, block_date
),
amounts AS (
  SELECT
    coalesce(M.token0, B.token0, S.token0) as token0,
    coalesce(M.token1, B.token1, S.token1) as token1,
    coalesce(M.block_date, B.block_date, S.block_date) as block_date,
    (ifnull(M.sum0,0)-ifnull(B.sum0,0)+ifnull(S.sum0,0)) AS sum0,
    (ifnull(M.sum1,0)-ifnull(B.sum1,0)+ifnull(S.sum1,0)) AS sum1
  FROM burning B
  FULL OUTER JOIN minting M
  ON B.pool = M.pool
  AND B.block_date = M.block_date
  FULL OUTER JOIN swapping S
  ON M.pool = S.pool
  AND M.block_date = S.block_date
),
v3 AS (
  SELECT sum0 AS amount, token0 AS token, block_date
    FROM amounts
  UNION ALL
  SELECT sum1 AS amount, token1 AS token, block_date
    FROM amounts
),
final as (
  SELECT
    V.token,
    V.block_date,
    SUM (K.amount) as sum0
  FROM v3 as V, v3 as K
  WHERE V.token = K.token
    AND V.block_date >= K.block_date
  GROUP BY V.token, V.block_date
)
SELECT
  token as address,
  block_date as date,
  sum0 / pow(10, T.decimals) + CAST(T.volume AS NUMERIC) AS volume
FROM final F, supported_tokens T
WHERE F.token = T.address
ORDER BY date
