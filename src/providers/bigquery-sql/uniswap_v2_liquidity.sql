with supported_tokens AS (
  SELECT * FROM UNNEST(@supported_tokens)
),
burning AS (
  SELECT
    token0, token1,
    SUM (ifnull(safe_cast(B.amount0 AS BIGNUMERIC), 0)) sum0,
    SUM (ifnull(safe_cast(B.amount1 AS BIGNUMERIC), 0)) sum1
  FROM
    blockchain-etl.ethereum_uniswap.UniswapV2Pair_event_Burn B,
    blockchain-etl.ethereum_uniswap.UniswapV2Factory_event_PairCreated P
  WHERE B.contract_address = P.pair
    AND B.block_timestamp >= @date_from
    AND B.block_timestamp < @date_to
  GROUP BY token0, token1
),
minting AS (
  SELECT
    token0, token1,
    SUM (CAST(M.amount0 AS BIGNUMERIC)) sum0,
    SUM (CAST(M.amount1 AS BIGNUMERIC)) sum1
  FROM
    blockchain-etl.ethereum_uniswap.UniswapV2Pair_event_Mint M,
    blockchain-etl.ethereum_uniswap.UniswapV2Factory_event_PairCreated P
  WHERE M.contract_address = P.pair
    AND M.block_timestamp >= @date_from
    AND M.block_timestamp < @date_to
  GROUP BY token0, token1
),
swapping AS (
  SELECT
    token0, token1,
    CAST(S.amount0In AS BIGNUMERIC) AS amount0,
    CAST(S.amount1Out AS BIGNUMERIC) * -1 AS amount1
  FROM
    blockchain-etl.ethereum_uniswap.UniswapV2Pair_event_Swap S,
    blockchain-etl.ethereum_uniswap.UniswapV2Factory_event_PairCreated P
  WHERE S.contract_address = P.pair
    AND S.block_timestamp >= @date_from
    AND S.block_timestamp < @date_to
    AND S.amount0In !='0'
    AND S.amount0Out ='0'
    AND S.amount1Out !='0'
  UNION ALL
  SELECT
    token0, token1,
    CAST(S.amount0Out AS BIGNUMERIC) * -1 AS amount0,
    CAST(S.amount1In AS BIGNUMERIC) AS amount1
  FROM
    blockchain-etl.ethereum_uniswap.UniswapV2Pair_event_Swap S,
    blockchain-etl.ethereum_uniswap.UniswapV2Factory_event_PairCreated P
  WHERE S.contract_address = P.pair
    AND S.block_timestamp >= @date_from
    AND S.block_timestamp < @date_to
    AND S.amount1In !='0'
    AND S.amount0Out !='0'
    AND S.amount1Out ='0'
),
swapping_sum AS (
  SELECT
    token0, token1,
    SUM(amount0) sum0,
    SUM(amount1) sum1,
  FROM swapping
  GROUP BY token0, token1
),
amounts AS (
  SELECT
    COALESCE(M.token0, B.token0, S.token0) as token0,
    COALESCE(M.token1, B.token1, S.token1) as token1,
    ifnull(M.sum0, 0) - ifnull(B.sum0, 0) + ifnull(S.sum0, 0) AS sum0,
    ifnull(M.sum1, 0) - ifnull(B.sum1, 0) + ifnull(S.sum1, 0) AS sum1
  FROM burning B
  FULL OUTER JOIN minting M
    ON B.token0 = M.token0
    AND B.token1 = M.token1
  FULL OUTER JOIN swapping_sum S
    ON M.token0 = S.token0
    AND M.token1 = S.token1
),
v2 AS (
  SELECT sum0, token0 as token
  FROM amounts
  UNION ALL
  SELECT sum1 AS sum0, token1 AS token
  FROM amounts
)
SELECT
  token as address,
  SUM (sum0)/pow(10, T.decimals) AS volume,
  TIMESTAMP_SUB(timestamp(@date_to), INTERVAL 1 DAY) as date
 FROM v2, supported_tokens T
WHERE v2.token = T.address
GROUP BY token, date, T.decimals
