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

exports.transactionStatsSQL = window => {
  return (`
    with supported_tokens as (
      SELECT * FROM UNNEST(@supported_tokens)
    ),
    transactions as (
      SELECT
        block_timestamp,
        'ethereum' as address,
        value / POW(10,18) AS volume
      FROM \`bigquery-public-data.crypto_ethereum.transactions\`
      WHERE block_timestamp >= @dateFrom
        AND block_timestamp < @dateTo
      UNION ALL
      SELECT
        block_timestamp,
        token_address as address,
        SAFE_CAST(value AS BIGNUMERIC) / POW(10,decimals) as volume
        FROM \`bigquery-public-data.crypto_ethereum.token_transfers\`, supported_tokens tokens
       WHERE token_address = tokens.address
         AND block_timestamp >= @dateFrom
         AND block_timestamp < @dateTo
    )
    SELECT
      address,
      ${extractDateWindow(window)} as date,
      SUM(volume) as volume,
      COUNT(1) AS count
    FROM transactions
    GROUP BY address, date
    ORDER BY date ASC
  `)
}
