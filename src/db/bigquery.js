const { BigQuery } = require('@google-cloud/bigquery')

const logger = require('../config/logger')

async function getTransactions(fromDate) {
  const bigquery = new BigQuery()
  const query = [`
    SELECT
      date(block_timestamp) as date,
      count(1) as count,
      sum(value) / power(10, 18) as volume
    from \`bigquery-public-data.crypto_ethereum.transactions\`
  `]

  if (fromDate) {
    query.push(`WHERE DATE(block_timestamp) >= "${fromDate}"`)
  }

  query.push(`
    GROUP BY date
    ORDER BY date ASC
  `)

  const [job] = await bigquery.createQueryJob({
    query: query.join(' '),
    location: 'US'
  })

  logger.info(`Job ${job.id} started.`)

  const [rows] = await job.getQueryResults()
  return rows.map(item => ({
    ...item,
    date: item.date.value
  }))
}

module.exports = {
  getTransactions
}
