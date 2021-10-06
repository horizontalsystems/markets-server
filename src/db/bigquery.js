const { BigQuery } = require('@google-cloud/bigquery')
const { requireFile } = require('../utils')
const logger = require('../config/logger')

const transactionStatsSQL = requireFile('db/sql/transaction_stats.sql')
const addressRankSQL = requireFile('db/sql/address_rank.sql')
const addressStatsSQL = requireFile('db/sql/address_stats.sql')
const coinHoldersSQL = requireFile('db/sql/coin_holders.sql')

const bigquery = new BigQuery()

async function getTransactionsStats(dateFrom, dateTo, tokens, period) {
  const [job] = await bigquery.createQueryJob({
    query: transactionStatsSQL,
    location: 'US',
    params: {
      dateFrom,
      dateTo,
      period,
      supported_tokens: tokens
    }
  })

  logger.info(`Job ${job.id} started.`)

  const [rows] = await job.getQueryResults()
  return rows
}

// 2.7 GB query
async function getTopCoinHolders(tokens, fromDate, addressesPerCoin) {
  const [job] = await bigquery.createQueryJob({
    query: coinHoldersSQL,
    location: 'US',
    params: {
      supported_tokens: tokens,
      from_date: fromDate,
      addresses_per_coin: addressesPerCoin
    }
  })

  logger.info(`Job ${job.id} for CoinHolders started.`)

  const [rows] = await job.getQueryResults()
  return rows
}

// 2.7 GB query , for 3 month
async function getTopAddresses(tokens, fromDate, addressesPerCoin) {
  const [job] = await bigquery.createQueryJob({
    query: addressRankSQL,
    location: 'US',
    params: {
      supported_tokens: tokens,
      from_date: fromDate,
      addresses_per_coin: addressesPerCoin
    }
  })

  logger.info(`Job ${job.id} for AddressRanks started.`)

  const [rows] = await job.getQueryResults()
  return rows
}

// 2 GB query for 3 month
async function getAddressStats(tokens, dateFrom, dateTo, timePeriod) {
  const [job] = await bigquery.createQueryJob({
    query: addressStatsSQL,
    location: 'US',
    params: {
      supported_tokens: tokens,
      period: timePeriod,
      from_date: dateFrom,
      to_date: dateTo,
    }
  })

  logger.info(`Job ${job.id} for AddressStats started.`)

  const [rows] = await job.getQueryResults()
  return rows
}

module.exports = {
  getTransactionsStats,
  getTopCoinHolders,
  getTopAddresses,
  getAddressStats
}
