const { BigQuery } = require('@google-cloud/bigquery')
const transactionStatsSQL = require('./sql/transactions_stats.sql')
const addressRankSQL = require('./sql/address_rank.sql')
const addressStatsSQL = require('./sql/address_stats.sql')

const logger = require('../config/logger')

async function getTransactions(fromDate) {
  const bigquery = new BigQuery()
  const [job] = await bigquery.createQueryJob({
    query: transactionStatsSQL,
    location: 'US',
    params: {from_date: fromDate.toISOString()},
  })

  logger.info(`Job ${job.id} started.`)

  const [rows] = await job.getQueryResults()
  return rows.map(item => ({
    ...item,
    date: item.date.value
  }))
}


// 2.7 GB query
async function getTopAddresses(fromDate, recordCount) {
  const bigquery = new BigQuery()

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
  return rows.map(item => ({
    ...item,
    date: item.date.value
  }))
}

// 2.7 GB query
async function getAddressStats(fromDate) {
  const bigquery = new BigQuery()

  const [job] = await bigquery.createQueryJob({
    query: addressStatsSQL,
    location: 'US',
    params: {
      from_date: fromDate.toISOString()
    }
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
  getTopAddresses,
  getAddressStats
}
