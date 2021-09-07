const { BigQuery } = require('@google-cloud/bigquery')

const logger = require('../config/logger')

async function getTransactions(fromDate) {
  const bigquery = new BigQuery()
  const query = `
    SELECT
      date(block_timestamp) as date,
      count(1) as count,
      sum(value) / power(10, 18) as volume
    from \`bigquery-public-data.crypto_ethereum.transactions\`
    WHERE block_timestamp >= "${fromDate.toISOString()}"
    GROUP BY date
    ORDER BY date ASC
  `

  const [job] = await bigquery.createQueryJob({
    query,
    location: 'US'
  })

  logger.info(`Job ${job.id} started.`)

  const [rows] = await job.getQueryResults()
  return rows.map(item => ({
    ...item,
    date: item.date.value
  }))
}

async function getAddresses(fromDate) {
  const bigquery = new BigQuery()
  const query = `
    WITH entry_book AS (
      SELECT
        DISTINCT to_address AS address,
        DATE(block_timestamp) as date
      FROM \`bigquery-public-data.crypto_ethereum.traces\`
      WHERE
        to_address IS NOT NULL
        AND status = 1
        AND (call_type NOT IN ('delegatecall', 'callcode', 'staticcall') OR call_type IS NULL)
        AND block_timestamp >= "${fromDate.toISOString()}"
    )
    SELECT COUNT(address) AS count, date
    FROM entry_book
    GROUP BY date
    ORDER BY date DESC
  `

  const [job] = await bigquery.createQueryJob({
    query,
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
  getTransactions,
  getAddresses
}
