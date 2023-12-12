const { DateTime } = require('luxon')
const coingecko = require('../providers/coingecko')
const utils = require('../utils')
const Coin = require('../db/models/Coin')
const CoinPrice = require('../db/models/CoinPrice')
const Syncer = require('./Syncer')

const debug = msg => {
  console.log(new Date(), msg)
}

class CoinPriceHistorySyncer extends Syncer {

  adjustHistoryGaps() {
    this.cron('30m', this.deleteExpired)
    this.cron('4h', this.deleteExpired)
    this.cron('1d', this.deleteExpired)
  }

  deleteExpired({ dateFrom, dateTo }) {
    return CoinPrice.deleteExpired(dateFrom, dateTo)
  }

  async getCoins(uid) {
    const coins = await Coin.findAll({
      attributes: ['id', 'coingecko_id'],
      where: {
        ...(uid && { uid }),
        coingecko_id: Coin.literal('coingecko_id IS NOT NULL')
      }
    })

    const uids = new Set()
    const map = {}

    for (let i = 0; i < coins.length; i += 1) {
      const coin = coins[i]
      const cid = coin.coingecko_id
      const ids = map[cid] || (map[cid] = [])

      uids.add(encodeURIComponent(cid))
      ids.push(coin.id)
    }

    return { uids, map }
  }

  async syncHistory(uid, all) {
    const coins = await Coin.query(`
      SELECT c.id, c.uid, c.coingecko_id, EXTRACT (epoch FROM p.date)::int as timestamp
      FROM coins c
      LEFT JOIN coin_prices p ON c.id = p.coin_id AND p.date = (
        SELECT MIN(date) FROM coin_prices pp WHERE pp.coin_id = c.id
      )
      WHERE c.coingecko_id is NOT NULL ${uid ? ' AND c.uid IN (:uid)' : ''}
    `, { uid })

    const syncParams1y = this.syncParamsHistorical('1y')
    const syncParams1M = this.syncParamsHistorical('1M')

    for (let i = 0; i < coins.length; i += 1) {
      const coin = coins[i]

      console.log(`Syncing: ${coin.uid}. Coingecko_id: ${coin.coingecko_id} (${i + 1}/${coins.length})`)

      if (all) {
        await this.syncRange(DateTime.fromISO('2010-01-01'), DateTime.fromSeconds(coin.timestamp || syncParams1y.dateTo.toSeconds()), coin)
      } else {
        await this.syncRange(syncParams1y.dateFrom, syncParams1y.dateTo, coin)
        await this.syncRange(syncParams1M.dateFrom, syncParams1M.dateTo, coin)
      }
    }
  }

  async syncRange(dateFrom, dateTo, coin, retry = 0) {
    if (retry >= 10) {
      return
    }

    try {
      const data = await coingecko.getMarketsChart(coin.coingecko_id, dateFrom.toSeconds(), dateTo.toSeconds())
      await this.storeMarketData(data.prices, data.total_volumes, coin.id)
      await utils.sleep(4000)
    } catch ({ message, response = {} }) {
      if (message) {
        console.error(`Error fetching prices chart ${message}`)
      }

      if (response.status === 429) {
        console.error(`Sleeping 60s (coin-price-syncer); Status ${response.status}`)
        await utils.sleep(60000)
        await this.syncRange(dateFrom, dateTo, coin, retry + 1)
      }

      if (response.status >= 502 && response.status <= 504) {
        console.error(`Sleeping 30s (coin-price-syncer); Status ${response.status}`)
        await utils.sleep(30000)
        await this.syncRange(dateFrom, dateTo, coin, retry + 1)
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

  async handleHttpError({ message, response = {} }) {
    if (message) {
      console.error(message)
    }

    if (response.status === 429) {
      debug(`Sleeping 1min; Status ${response.status}`)
      await utils.sleep(60000)
    } else if (response.status >= 502 && response.status <= 504) {
      debug(`Sleeping 30s; Status ${response.status}`)
      await utils.sleep(30000)
    } else if (response.status >= 400 && response.status <= 403) {
      debug(`Sleeping 30s; Status ${response.status}`)
      await utils.sleep(30000)
    } else {
      await utils.sleep(50000)
    }
  }
}

module.exports = CoinPriceHistorySyncer
