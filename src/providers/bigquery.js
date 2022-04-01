const { BigQuery } = require('@google-cloud/bigquery')
const { requireFile } = require('../utils')
const logger = require('../config/logger')

const transactionStatsSQL = requireFile('providers/bigquery-sql/transaction_stats.sql')
const addressStatsSQL = requireFile('providers/bigquery-sql/address_stats.sql')
const addressStatsBtcSQL = requireFile('providers/bigquery-sql/address_stats_btc.sql')
const coinHoldersSQL = requireFile('providers/bigquery-sql/coin_holders.sql')

const dexVolume = {
  sushi: requireFile('providers/bigquery-sql/sushi_volumes.sql'),
  uniswap_v2: requireFile('providers/bigquery-sql/uniswap_v2_volumes.sql'),
  uniswap_v3: requireFile('providers/bigquery-sql/uniswap_v3_volumes.sql'),
}

const dexLiquidity = {
  sushi: requireFile('providers/bigquery-sql/sushi_liquidity.sql'),
  sushi_bydate: requireFile('providers/bigquery-sql/sushi_liquidity_bydate.sql'),
  uniswap_v2: requireFile('providers/bigquery-sql/uniswap_v2_liquidity.sql'),
  uniswap_v3: requireFile('providers/bigquery-sql/uniswap_v3_liquidity.sql'),
  uniswap_v2_bydate: requireFile('providers/bigquery-sql/uniswap_v2_liquidity_bydate.sql'),
  uniswap_v3_bydate: requireFile('providers/bigquery-sql/uniswap_v3_liquidity_bydate.sql')
}

class BigQueryClient extends BigQuery {

  async createQuery(query, params) {
    const [job] = await this.createQueryJob({ query, params, location: 'US' })
    logger.info(`Job ${job.id} started.`)

    const [rows] = await job.getQueryResults()
    return rows
  }

  getTransactionsStats(dateFrom, dateTo, tokens, period) {
    console.log('Fetching transactions')

    return this.createQuery(transactionStatsSQL, {
      dateFrom,
      dateTo,
      period,
      supported_tokens: tokens
    })
  }

  getDexLiquidity(dateFrom, dateTo, period, tokens, queryType) {
    console.log(`Fetching ${queryType} dex liquidity`)

    return this.createQuery(dexLiquidity[queryType], {
      period,
      date_from: dateFrom,
      date_to: dateTo,
      supported_tokens: tokens
    })
  }

  getDexVolumes(dateFrom, dateTo, tokens, period, queryType) {
    console.log(`Fetching ${queryType} dex volumes`)

    return this.createQuery(dexVolume[queryType], {
      dateFrom,
      dateTo,
      period,
      supported_tokens: tokens
    })
  }

  getTopCoinHolders(tokens, dateFrom, addressesPerCoin) {
    return this.createQuery(coinHoldersSQL, {
      supported_tokens: tokens,
      date_from: dateFrom,
      addresses_per_coin: addressesPerCoin
    })
  }

  async getAddressStats(tokens, dateFrom, dateTo, timePeriod) {
    console.log('Fetching address stats')
    const addressStats = await this.createQuery(addressStatsSQL, {
      supported_tokens: tokens,
      period: timePeriod,
      date_from: dateFrom,
      date_to: dateTo,
    })

    const addressStatsBtc = await this.createQuery(addressStatsBtcSQL, {
      period: timePeriod,
      date_partition: `${dateFrom.substring(0, 8)}01`,
      date_from: dateFrom,
      date_to: dateTo,
    })

    return [...addressStats, ...addressStatsBtc]
  }
}

module.exports = new BigQueryClient()
