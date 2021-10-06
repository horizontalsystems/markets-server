with supported_tokens AS (
  SELECT * FROM UNNEST(@supported_tokens)
),
v2 AS (
  SELECT
    S.*, P.token0, P.token1
  FROM
    blockchain-etl.ethereum_uniswap.UniswapV2Pair_event_Swap S,
    blockchain-etl.ethereum_uniswap.UniswapV2Factory_event_PairCreated P
  WHERE S.contract_address = P.pair
    AND S.block_timestamp >= @dateFrom
    AND S.block_timestamp < @dateTo),
swaps AS (
  SELECT amount0In AS amount0, amount1Out AS amount1, token0, token1, block_timestamp
  FROM v2
  WHERE amount0In !='0'
    AND amount0Out ='0'
    AND amount1Out !='0'
  UNION ALL
  SELECT amount0Out AS amount0, amount1In AS amount1, token0, token1, block_timestamp
  FROM v2
  WHERE amount1In !='0'
    AND amount0Out !='0'
    AND amount1Out ='0'
  UNION ALL
  SELECT amount1Out AS amount0, amount0In AS amount1, token1 AS token0, token0 AS token1, block_timestamp
  FROM v2
  WHERE amount0In !='0'
    AND amount0Out ='0'
    AND amount1Out !='0'
  UNION ALL
  SELECT amount1In AS amount0, amount0Out AS amount1, token1 AS token0, token0 AS token1, block_timestamp
  FROM v2
  WHERE amount1In !='0'
    AND amount0Out !='0'
    AND amount1Out ='0'
)
SELECT
  token0 as address,
  CASE @period
    WHEN '1h' THEN TIMESTAMP_TRUNC(block_timestamp, HOUR)
    WHEN '4h' THEN TIMESTAMP_SECONDS(4*60*60 * DIV(UNIX_SECONDS(block_timestamp), 4*60*60))
    ELSE TIMESTAMP_TRUNC(block_timestamp, DAY)
  END AS date,
  SUM (ifnull(safe_cast(amount0 AS BIGNUMERIC),0)) / POW(10,T.decimals) AS volume
 FROM swaps, supported_tokens AS T
WHERE swaps.token0 = T.address
GROUP BY date, address, T.decimals
ORDER BY date
