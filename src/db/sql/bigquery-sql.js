function extractDateWindow(window = '1h') {
  switch (window) {
    case '1h':
      return 'TIMESTAMP_TRUNC(block_timestamp, HOUR)'
    case '4h':
      return 'TIMESTAMP_SECONDS(4*60*60 * DIV(UNIX_SECONDS(block_timestamp), 4*60*60))'
    default:
      return 'DATE(block_timestamp)'
  }
}

exports.transactionStatsSQL = (date, window) => {
  return (`
    SELECT
      ${extractDateWindow(window)} AS date,
      COUNT(1) AS count,
      SUM(value / POW(10,18)) AS volume
    FROM \`bigquery-public-data.crypto_ethereum.transactions\`
    WHERE block_timestamp ${window === '1h' ? '>=' : '='} '${date}'
    GROUP BY date
    ORDER BY date ASC
  `)
}

exports.tokensTransfersSQL = window => {
  return (`
    with supported_tokens as (
      SELECT * FROM UNNEST(@supported_tokens)
    ),
    all_transfers as (
      SELECT
        token_address as address,
        SAFE_CAST(value AS BIGNUMERIC)/POW(10,decimals) as volume,
        ${extractDateWindow(window)} AS date 
        FROM \`bigquery-public-data.crypto_ethereum.token_transfers\` transfers, supported_tokens tokens
       WHERE token_address = tokens.address 
         AND block_timestamp ${window === '1h' ? '>=' : '='} @date
    )
    SELECT 
      date,
      address,
      sum(volume) as volume,
      count(1) AS count
    FROM all_transfers
    GROUP BY address, date
    ORDER BY date ASC
  `)
}
