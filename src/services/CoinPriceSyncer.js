const { DateTime } = require('luxon')
const logger = require('../config/logger')
const coingecko = require('../providers/coingecko')
const utils = require('../utils')
const Coin = require('../db/models/Coin')
const CoinPrice = require('../db/models/CoinPrice')
const Syncer = require('./Syncer')

class CoinPriceSyncer extends Syncer {

  async start() {
    await this.syncHistorical()
    await this.syncLatest()
  }

  async syncHistorical(uids) {
    if (uids) {
      return this.syncHistory(uids)
    }

    if (await CoinPrice.exists()) {
      return
    }

    await this.syncHistory()
  }

  syncLatest() {
    this.cron('30m', this.syncDailyStats)
    this.cron('1d', this.syncMonthlyStats)
  }

  syncDailyStats({ dateFrom, dateTo }) {
    return CoinPrice.deleteExpired(dateFrom, dateTo)
  }

  syncMonthlyStats({ dateFrom, dateTo }) {
    return CoinPrice.deleteExpired(dateFrom, dateTo)
  }

  async syncHistory(uids) {
    const where = uids ? { uid: uids } : null
    const coins = await Coin.findAll({ attributes: ['id', 'uid', 'coingecko_id'], where })

    const syncParams1d = this.syncParamsHistorical('1d')
    const syncParams1h = this.syncParamsHistorical('1h')

    for (let i = 0; i < coins.length; i += 1) {
      const coin = coins[i]

      logger.info(`Syncing: ${coin.uid}. Coingecko_id: ${coin.coingecko_id} (${i + 1}/${coins.length})`)

      await this.syncRange(syncParams1d.dateFrom, syncParams1d.dateTo, coin)
      await this.syncRange(syncParams1h.dateFrom, syncParams1h.dateTo, coin)
    }
  }

  async syncRange(dateFrom, dateTo, coin) {
    try {
      const data = await coingecko.getMarketsChart(coin.coingecko_id, dateFrom.toSeconds(), dateTo.toSeconds())
      await this.storeMarketData(data.prices, data.total_volumes, coin.id)
      await utils.sleep(1100)
    } catch ({ message, response = {} }) {
      if (message) {
        logger.error(`Error fetching prices chart ${message}`)
      }

      if (response.status === 429) {
        logger.error(`Sleeping 60s (coin-price-syncer); Status ${response.status}`)
        await utils.sleep(60000)
      }

      if (response.status >= 502 && response.status <= 504) {
        logger.error(`Sleeping 30s (coin-price-syncer); Status ${response.status}`)
        await utils.sleep(30000)
      }
    }
  }

  storeMarketData(prices, totalVolumes, coinId) {
    const records = []

    for (let marketsIndex = 0; marketsIndex < prices.length; marketsIndex += 1) {
      const timestamp = prices[marketsIndex][0]
      const date = DateTime.fromMillis(timestamp).toFormat('yyyy-MM-dd HH:00:00Z')

      records.push({
        date,
        coin_id: coinId,
        price: prices[marketsIndex][1],
        volume: totalVolumes[marketsIndex][1]
      })
    }

    this.upsertCoinPrices(records)
  }

  syncParamsHistorical(period) {
    const now = DateTime.utc()
    switch (period) {
      case '1h':
        return {
          dateFrom: now.plus({ days: -30 }),
          dateTo: now
        }
      case '1d':
        return {
          dateFrom: now.plus({ month: -24 }),
          dateTo: now
        }
      default:
        return {}
    }
  }

  syncParams(period) {
    switch (period) {
      case '30m':
        return {
          dateFrom: utils.utcDate('yyyy-MM-dd HH:00:00Z', { days: -30, minutes: -30 }),
          dateTo: utils.utcDate('yyyy-MM-dd HH:00:00Z', { days: -30 }),
        }
      case '1d':
        return {
          dateFrom: utils.utcDate('yyyy-MM-dd', { days: -31 }),
          dateTo: utils.utcDate('yyyy-MM-dd', { days: -30 })
        }
      default:
        return {}
    }
  }

  upsertCoinPrices(prices) {
    if (!prices.length) {
      return
    }

    CoinPrice.bulkCreate(prices, { ignoreDuplicates: true })
      .then(records => {
        console.log(`Successfully inserted "${records.length}" coin prices`)
      })
      .catch(err => {
        console.log(`Error inserting coin prices ${err.message}`)
      })
  }
}

module.exports = CoinPriceSyncer
