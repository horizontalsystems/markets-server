const { DateTime } = require('luxon')
const utils = require('../utils')
const coinstats = require('../providers/coinstats')
const Coin = require('../db/models/Coin')
const CoinPriceHistorySyncer = require('./CoinPriceHistorySyncer')
const CoinPrice = require('../db/models/CoinPrice')

const debug = msg => {
  console.log(new Date(), msg)
}

class CoinStatsSyncer extends CoinPriceHistorySyncer {

  constructor() {
    super()
    this.prices = {}
  }

  async start(syncHistorical) {
    if (syncHistorical) {
      this.cron('10m', this.syncHistoricalPrices)
    }

    const running = true
    while (running) {
      try {
        await this.syncCoins()
      } catch (e) {
        debug(e)
        process.exit(1)
      }
    }
  }

  async syncCoins(uid, syncHistorical) {
    const coins = await this.getCoins(uid)
    const chunk = 2000
    const chunks = Array(5).fill(chunk)

    for (let i = 0; i < chunks.length; i += 1) {
      await this.fetchStats(chunk * i, chunk, coins)
    }

    if (syncHistorical) {
      await this.syncHistoricalPrices()
    }
  }

  async syncHistoricalPrices() {
    const records = Object.values(this.prices)
    if (!records.length) {
      return
    }
    console.log('Syncing historical prices', records.length)
    this.prices = {}
    return CoinPrice.bulkCreate(records, { updateOnDuplicate: ['price'] })
  }

  async fetchStats(skip, limit, idsMap) {
    debug(`Syncing coins ${skip}-${limit}`)

    try {
      const coins = await coinstats.getCoins(skip, limit)
      await this.updateCoins(coins, idsMap)
      await utils.sleep(2000)
    } catch ({ message, response = {} }) {
      if (message) {
        console.error(message)
      }
    }
  }

  async getCoins(uid) {
    const coins = await Coin.findAll({
      attributes: ['id', 'uid', 'coingecko_id'],
      where: {
        ...(uid && { uid })
      }
    })

    const map = {}

    for (let i = 0; i < coins.length; i += 1) {
      const coin = coins[i]
      map[coin.coingecko_id || coin.uid] = coin.id
    }

    return map
  }

  async updateCoins(coins, idsMap) {
    const now = DateTime.now()
    const nowStr = now.toSQL()
    const minutes = now.get('minute')
    const minutesRounded = now
      .set({ minute: 10 * parseInt(minutes / 10, 10) })
      .toFormat('yyyy-MM-dd HH:mm')

    const values = []

    for (let i = 0; i < coins.length; i += 1) {
      const coin = coins[i];
      const coinId = idsMap[coin.id] || idsMap[coin.id.replace('-', '')]
      if (coin.price && coinId) {
        values.push([coinId, coin.price, nowStr])

        if (coin.volume) {
          this.prices[coinId] = {
            coin_id: coinId,
            price: coin.price,
            date: minutesRounded,
            volume: coin.volume
          }
        }
      }
    }

    if (!values.length) {
      return
    }

    try {
      await Coin.updatePrices(values)
      debug(`Synced coins ${values.length}`)
    } catch (e) {
      debug(e)
    }
  }
}

module.exports = CoinStatsSyncer
