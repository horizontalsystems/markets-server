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

exports.tokensTransfersSQL = () => ({
  query: (date, window, filterTokens) => {
    return (`
      with all_transfers as (
        SELECT
          value,
          token_address as address,
          ${extractDateWindow(window)} AS date
        FROM \`bigquery-public-data.crypto_ethereum.token_transfers\`
        WHERE block_timestamp ${window === '1h' ? '>=' : '='} '${date}'
      ),
      filtered_transfers as (
        ${filterTokens}
      )
      SELECT 
        date,
        address,
        SUM(volume) AS volume,
        count(1) AS count
      FROM filtered_transfers
      GROUP BY address, date
      ORDER BY date ASC
    `)
  },

  filterTokens: (decimal, tokens) => {
    return (`
      SELECT 
        date,
        address,
        safe_cast(value AS NUMERIC)/POW(10, ${decimal}) as volume
      FROM all_transfers
      WHERE address IN (${tokens})
    `)
  }
})
