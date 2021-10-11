const { BigQuery } = require('@google-cloud/bigquery')
const { requireFile } = require('../utils')
const logger = require('../config/logger')

const bigquery = new BigQuery()
const transactionStatsSQL = requireFile('db/sql/transaction_stats.sql')
const addressRankSQL = requireFile('db/sql/address_rank.sql')
const addressStatsSQL = requireFile('db/sql/address_stats.sql')
const coinHoldersSQL = requireFile('db/sql/coin_holders.sql')

const dexVolume = {
  sushi: requireFile('db/sql/sushi_volumes.sql'),
  uniswap_v2: requireFile('db/sql/uniswap_v2_volumes.sql'),
  uniswap_v3: requireFile('db/sql/uniswap_v3_volumes.sql'),
}

const dexLiquidity = {
  sushi: requireFile('db/sql/sushi_liquidity.sql'),
  sushi_bydate: requireFile('db/sql/sushi_liquidity_bydate.sql'),
  uniswap_v2: requireFile('db/sql/uniswap_v2_liquidity.sql'),
  uniswap_v3: requireFile('db/sql/uniswap_v3_liquidity.sql'),
  uniswap_v2_bydate: requireFile('db/sql/uniswap_v2_liquidity_bydate.sql'),
  uniswap_v3_bydate: requireFile('db/sql/uniswap_v3_liquidity_bydate.sql')
}

exports.getTransactionsStats = async (dateFrom, dateTo, tokens, period) => {
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

exports.getDexLiquidity = async (dateFrom, dateTo, period, tokens, queryType) => {
  const query = dexLiquidity[queryType]
  const [job] = await bigquery.createQueryJob({
    query,
    location: 'US',
    params: {
      period,
      date_from: dateFrom,
      date_to: dateTo,
      supported_tokens: tokens
    }
  })

  logger.info(`Job ${job.id} started.`)

  const [rows] = await job.getQueryResults()
  return rows
}

exports.getDexVolumes = async (dateFrom, dateTo, tokens, period, queryType) => {
  const query = dexVolume[queryType]
  const [job] = await bigquery.createQueryJob({
    query,
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
exports.getTopCoinHolders = async (tokens, dateFrom, addressesPerCoin) => {
  const [job] = await bigquery.createQueryJob({
    query: coinHoldersSQL,
    location: 'US',
    params: {
      supported_tokens: tokens,
      date_from: dateFrom,
      addresses_per_coin: addressesPerCoin
    }
  })

  logger.info(`Job ${job.id} for CoinHolders started.`)

  const [rows] = await job.getQueryResults()
  return rows
}

// 2.7 GB query , for 3 month
exports.getTopAddresses = async (tokens, dateFrom, addressesPerCoin) => {
  const [job] = await bigquery.createQueryJob({
    query: addressRankSQL,
    location: 'US',
    params: {
      supported_tokens: tokens,
      date_from: dateFrom,
      addresses_per_coin: addressesPerCoin
    }
  })

  logger.info(`Job ${job.id} for AddressRanks started.`)

  const [rows] = await job.getQueryResults()
  return rows
}

// 2 GB query for 3 month
exports.getAddressStats = async (tokens, dateFrom, dateTo, timePeriod) => {
  const [job] = await bigquery.createQueryJob({
    query: addressStatsSQL,
    location: 'US',
    params: {
      supported_tokens: tokens,
      period: timePeriod,
      date_from: dateFrom,
      date_to: dateTo,
    }
  })

  logger.info(`Job ${job.id} for AddressStats started.`)

  const [rows] = await job.getQueryResults()
  return rows
}
