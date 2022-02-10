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

  async fetchNotSyncedCoins() {
    const coinsNotSynced = await CoinPrice.getNotSyncedCoins()
    const uids = coinsNotSynced.map(i => i.uid)

    console.log(`Listed not synced coins: ${uids.length}`)
    console.log(uids.join(','))
  }

  async syncLatest() {
    this.cron('4h', this.syncWeeklyStats)
    this.cron('1d', this.syncMonthlyStats)
  }

  async syncHistorical(coinIds) {
    if (!coinIds && await CoinPrice.exists()) {
      return
    }

    await this.sync(this.syncParamsHistorical('1d'), coinIds)
  }

  async syncWeeklyStats(dateParams) {
    await this.adjustPoints(dateParams.dateFrom, dateParams.dateTo)
  }

  async syncMonthlyStats(dateParams) {
    await this.adjustPoints(dateParams.dateFrom, dateParams.dateTo)
  }

  async adjustPoints(dateFrom, dateTo) {
    await CoinPrice.deleteExpired(dateFrom, dateTo)
  }

  async sync({ dateFrom, dateTo, period }, coinIds) {
    let coins = []
    if (coinIds) {
      coins = await Coin.findAll({ attributes: ['id', 'uid'], where: { uid: coinIds } })
    } else {
      coins = await Coin.findAll({ attributes: ['id', 'uid'] })
    }

    logger.info(`Start syncing historical price for period:${period}, /${coins.length} coins`)

    for (let coinsIndex = 0; coinsIndex < coins.length; coinsIndex += 1) {
      try {

        logger.info(`Syncing "${coins[coinsIndex].uid} ...". Synced ${coinsIndex + 1} coins`)

        const coinMarkets = []
        const marketsChart = await coingecko.getMarketsChart(
          coins[coinsIndex].uid,
          'usd',
          dateFrom.toMillis() / 1000,
          dateTo.toMillis() / 1000
        )

        let date
        for (let marketsIndex = 0; marketsIndex < marketsChart.prices.length; marketsIndex += 1) {

          const timestamp = marketsChart.prices[marketsIndex][0]

          if (period === '10m') {
            date = DateTime.fromMillis(timestamp).toFormat('yyyy-MM-dd HH:mm:00Z')
          } else if (period === '4h') {
            date = DateTime.fromMillis(timestamp).toFormat('yyyy-MM-dd HH:00:00Z')
          } else {
            date = DateTime.fromMillis(timestamp).toFormat('yyyy-MM-dd')
          }

          coinMarkets.push({
            date,
            coin_id: coins[coinsIndex].id,
            price: marketsChart.prices[marketsIndex][1],
            volume: marketsChart.total_volumes[marketsIndex][1]
          })
        }

        if (coinMarkets.length > 0) {
          this.upsertCoinPrices(coinMarkets)
        }

        // ---------------------------------
        await utils.sleep(1100)
        // ---------------------------------

      } catch ({ message, response = {} }) {

        if (response.status === 429) {
          logger.error(`Sleeping 1min (histo-price sync); Status ${response.status}`)
          await utils.sleep(60000)
        }

        if (response.status >= 502 && response.status <= 504) {
          logger.error(`Sleeping 30s (histo-price sync); Status ${response.status}`)
          await utils.sleep(30000)
        }
      }
    }

    logger.info(`Successfully synced historical prices for period: ${period}`)

  }

  syncParamsHistorical(period) {
    switch (period) {
      case '10m':
        return {
          dateFrom: DateTime.utc().plus({ hours: -24 }),
          dateTo: DateTime.utc(),
          period
        }
      case '4h':
        return {
          dateFrom: DateTime.utc().plus({ days: -7 }),
          dateTo: DateTime.utc().plus({ days: -1 }),
          period
        }
      case '1d':
        return {
          dateFrom: DateTime.utc().plus({ month: -12 }),
          dateTo: DateTime.utc(),
          period
        }
      default:
        return {}
    }
  }

  upsertCoinPrices(coinMarkerts) {
    CoinPrice.bulkCreate(coinMarkerts, {
      updateOnDuplicate: ['coin_id', 'date', 'price', 'volume']
    })
      .then((response) => {
        console.log(`Successfully inserted "${response.length}" data`)
      })
      .catch(err => {
        console.error('Error inserting historical coin prices:', err.message)
      })
  }
}

module.exports = CoinPriceSyncer
