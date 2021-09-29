const { BigQuery } = require('@google-cloud/bigquery')
const { requireFile } = require('../utils')
const logger = require('../config/logger')
const sql = require('./sql/bigquery-sql')

const addressRankSQL = requireFile('db/sql/address_rank.sql')
const addressStatsSQL = requireFile('db/sql/address_stats.sql')
const bigquery = new BigQuery()

async function getTokenTransfers(dateFrom, tokensMap, window) {
  const filters = []
  const transferSQL = sql.tokensTransfersSQL()

  Object.keys(tokensMap).forEach(decimal => {
    const tokens = tokensMap[decimal].map(token => `'${token}'`)
    filters.push(transferSQL.filterTokens(decimal, tokens))
  })

  const [job] = await bigquery.createQueryJob({
    query: transferSQL.query(dateFrom, window, filters.join(' UNION ALL ')),
    location: 'US'
  })

  logger.info(`Job ${job.id} started.`)

  const [rows] = await job.getQueryResults()
  return rows
}

async function getEtherTransactions(dateFrom, window) {
  const [job] = await bigquery.createQueryJob({
    query: sql.transactionStatsSQL(dateFrom, window),
    location: 'US'
  })

  logger.info(`Job ${job.id} started.`)

  const [rows] = await job.getQueryResults()
  return rows
}

// 2.7 GB query
async function getTopAddresses(fromDate, recordCount) {
  const [job] = await bigquery.createQueryJob({
    query: addressRankSQL,
    location: 'US',
    params: {
      from_date: fromDate.toISOString(),
      record_count: recordCount
    }
  })

  logger.info(`Job ${job.id} started.`)

  const [rows] = await job.getQueryResults()
  return rows.map((item) => ({
    ...item,
    date: item.date.value
  }))
}

// 2.7 GB query
async function getAddressStats(fromDate) {
  const [job] = await bigquery.createQueryJob({
    query: addressStatsSQL,
    location: 'US',
    params: {
      from_date: fromDate.toISOString()
    }
  })

  logger.info(`Job ${job.id} started.`)

  const [rows] = await job.getQueryResults()
  return rows.map((item) => ({
    ...item,
    date: item.date.value
  }))
}

module.exports = {
  getEtherTransactions,
  getTokenTransfers,
  getTopAddresses,
  getAddressStats
}
