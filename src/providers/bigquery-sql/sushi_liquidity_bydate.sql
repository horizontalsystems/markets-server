with supported_tokens AS (
  SELECT * FROM UNNEST(@supported_tokens)
),
burning AS (
  SELECT
    token0, token1,
    SUM (ifnull(safe_cast(B.amount0 AS BIGNUMERIC), 0)) sum0,
    SUM (ifnull(safe_cast(B.amount1 AS BIGNUMERIC), 0)) sum1,
    CASE @period
      WHEN '30m' THEN TIMESTAMP_SECONDS(30*60 * DIV(UNIX_SECONDS(B.block_timestamp), 30*60))
      WHEN '1h' THEN TIMESTAMP_TRUNC(B.block_timestamp, HOUR)
      WHEN '1d' THEN TIMESTAMP_TRUNC(B.block_timestamp, DAY)
    END as block_date
  FROM
    blockchain-etl.ethereum_sushiswap.UniswapV2Pair_event_Burn B,
    blockchain-etl.ethereum_sushiswap.UniswapV2Factory_event_PairCreated P
  WHERE B.contract_address = P.pair
    AND B.block_timestamp >= @date_from
    AND B.block_timestamp < @date_to
  GROUP BY token0, token1, block_date
),
minting AS (
  SELECT
    token0, token1,
    SUM (CAST(M.amount0 AS BIGNUMERIC)) sum0,
    SUM (CAST(M.amount1 AS BIGNUMERIC)) sum1,
    CASE @period
      WHEN '30m' THEN TIMESTAMP_SECONDS(30*60 * DIV(UNIX_SECONDS(M.block_timestamp), 30*60))
      WHEN '1h' THEN TIMESTAMP_TRUNC(M.block_timestamp, HOUR)
      WHEN '1d' THEN TIMESTAMP_TRUNC(M.block_timestamp, DAY)
    END as block_date
  FROM
    blockchain-etl.ethereum_sushiswap.UniswapV2Pair_event_Mint M,
    blockchain-etl.ethereum_sushiswap.UniswapV2Factory_event_PairCreated P
  WHERE M.contract_address = P.pair
    AND M.block_timestamp >= @date_from
    AND M.block_timestamp < @date_to
  GROUP BY token0, token1, block_date
),
swapping AS (
  SELECT
    token0, token1,
    CAST(S.amount0In AS BIGNUMERIC) AS amount0,
    CAST(S.amount1Out AS BIGNUMERIC) * -1 AS amount1,
    CASE @period
      WHEN '30m' THEN TIMESTAMP_SECONDS(30*60 * DIV(UNIX_SECONDS(S.block_timestamp), 30*60))
      WHEN '1h' THEN TIMESTAMP_TRUNC(S.block_timestamp, HOUR)
      WHEN '1d' THEN TIMESTAMP_TRUNC(S.block_timestamp, DAY)
    END as block_date
  FROM
    blockchain-etl.ethereum_sushiswap.UniswapV2Pair_event_Swap S,
    blockchain-etl.ethereum_sushiswap.UniswapV2Factory_event_PairCreated P
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
    CAST(S.amount1In AS BIGNUMERIC) AS amount1,
    CASE @period
      WHEN '30m' THEN TIMESTAMP_SECONDS(30*60 * DIV(UNIX_SECONDS(S.block_timestamp), 30*60))
      WHEN '1h' THEN TIMESTAMP_TRUNC(S.block_timestamp, HOUR)
      WHEN '1d' THEN TIMESTAMP_TRUNC(S.block_timestamp, DAY)
    END as block_date
  FROM
    blockchain-etl.ethereum_sushiswap.UniswapV2Pair_event_Swap S,
    blockchain-etl.ethereum_sushiswap.UniswapV2Factory_event_PairCreated P
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
    block_date
  FROM swapping
  GROUP BY token0, token1, block_date
),
amounts AS (
  SELECT
    coalesce(M.token0, B.token0, S.token0) as token0,
    coalesce(M.token1, B.token1, S.token1) as token1,
    coalesce(M.block_date, B.block_date, S.block_date) as block_date,
    ifnull(M.sum0, 0) - ifnull(B.sum0, 0) + ifnull(S.sum0, 0) AS sum0,
    ifnull(M.sum1, 0) - ifnull(B.sum1, 0) + ifnull(S.sum1, 0) AS sum1
  FROM burning B
  FULL OUTER JOIN minting M
    ON B.token0 = M.token0
    AND B.token1 = M.token1
    AND B.block_date = M.block_date
  FULL OUTER JOIN swapping_sum S
    ON M.token0 = S.token0
    AND M.token1 = S.token1
    AND M.block_date = S.block_date
),
sushi AS (
  SELECT sum0, token0 as token, block_date
  FROM amounts
  UNION ALL
  SELECT sum1 AS sum0, token1 AS token, block_date
  FROM amounts
),
final as (
  SELECT
    V.token,
    V.block_date,
    SUM (K.sum0) as sum0
  FROM sushi as V, sushi as K
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

