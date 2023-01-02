const { DateTime } = require('luxon')
const coingecko = require('../providers/coingecko')
const utils = require('../utils')
const Coin = require('../db/models/Coin')
const CoinPrice = require('../db/models/CoinPrice')
const Syncer = require('./Syncer')

class CoinPriceHistorySyncer extends Syncer {

  adjustHistoryGaps() {
    this.cron('30m', this.deleteExpired)
    this.cron('4h', this.deleteExpired)
    this.cron('1d', this.deleteExpired)
  }

  deleteExpired({ dateFrom, dateTo }) {
    return CoinPrice.deleteExpired(dateFrom, dateTo)
  }

  async syncHistory(uid) {
    if (await CoinPrice.exists() && !uid) {
      return
    }

    const where = { ...(uid && { uid }) }
    const coins = await Coin.findAll({ attributes: ['id', 'uid', 'coingecko_id'], where })

    const syncParams1y = this.syncParamsHistorical('1y')
    const syncParams1M = this.syncParamsHistorical('1M')

    for (let i = 0; i < coins.length; i += 1) {
      const coin = coins[i]

      console.log(`Syncing: ${coin.uid}. Coingecko_id: ${coin.coingecko_id} (${i + 1}/${coins.length})`)

      await this.syncRange(syncParams1y.dateFrom, syncParams1y.dateTo, coin)
      await this.syncRange(syncParams1M.dateFrom, syncParams1M.dateTo, coin)
    }
  }

  async syncRange(dateFrom, dateTo, coin) {
    try {
      const data = await coingecko.getMarketsChart(coin.coingecko_id, dateFrom.toSeconds(), dateTo.toSeconds())
      await this.storeMarketData(data.prices, data.total_volumes, coin.id)
      await utils.sleep(1100)
    } catch ({ message, response = {} }) {
      if (message) {
        console.error(`Error fetching prices chart ${message}`)
      }

      if (response.status === 429) {
        console.error(`Sleeping 60s (coin-price-syncer); Status ${response.status}`)
        await utils.sleep(60000)
      }

      if (response.status >= 502 && response.status <= 504) {
        console.error(`Sleeping 30s (coin-price-syncer); Status ${response.status}`)
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
      case '1M':
        return {
          dateFrom: now.plus({ days: -30 }),
          dateTo: now
        }
      case '1y':
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
          dateFrom: utils.utcDate({ days: -1, minutes: -30 }),
          dateTo: utils.utcDate({ days: -1 }),
        }
      case '4h':
        return {
          dateFrom: utils.utcDate({ days: -7, hours: -4 }),
          dateTo: utils.utcDate({ days: -7 }),
        }
      case '1d':
        return {
          dateFrom: utils.utcDate({ days: -31 }, 'yyyy-MM-dd'),
          dateTo: utils.utcDate({ days: -30 }, 'yyyy-MM-dd')
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

module.exports = CoinPriceHistorySyncer
