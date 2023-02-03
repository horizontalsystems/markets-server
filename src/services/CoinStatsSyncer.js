const { DateTime } = require('luxon')
const utils = require('../utils')
const coinstats = require('../providers/coinstats')
const Coin = require('../db/models/Coin')
const CoinPriceHistorySyncer = require('./CoinPriceHistorySyncer')

const debug = msg => {
  console.log(new Date(), msg)
}

class CoinStatsSyncer extends CoinPriceHistorySyncer {

  async start() {
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

  async syncCoins(uid) {
    const coins = await this.getCoins(uid)
    const chunk = 2000
    const chunks = Array(5).fill(chunk)

    for (let i = 0; i < chunks.length; i += 1) {
      await this.fetchStats(chunk * i, chunk, coins)
    }
  }

  async fetchStats(skip, limit, idsMap) {
    debug(`Syncing coins ${skip}-${limit}`)

    try {
      const coins = await coinstats.getCoins(skip, limit)
      await this.updateCoins(coins, idsMap)
      await utils.sleep(1000)
    } catch ({ message, response = {} }) {
      if (message) {
        console.error(message)
      }
    }
  }

  async getCoins(uid) {
    const coins = await Coin.findAll({
      attributes: ['id', 'coingecko_id'],
      where: {
        ...(uid && { uid }),
        coingecko_id: Coin.literal('coingecko_id IS NOT NULL')
      }
    })

    const map = {}

    for (let i = 0; i < coins.length; i += 1) {
      const coin = coins[i]
      map[coin.coingecko_id] = coin.id
    }

    return map
  }

  async updateCoins(coins, idsMap) {
    const now = DateTime.utc().toSQL()

    const mapData = (id, item) => [
      id,
      item.price,
      now
    ]

    const values = coins
      .map(c => {
        const id = idsMap[c.id]
        return c.price && id ? mapData(id, c) : null
      })
      .filter(c => c)

    if (!values.length) {
      return
    }

    try {
      await Coin.updatePrices(values).then(console.log)
      debug(`Synced coins ${values.length}`)
    } catch (e) {
      debug(e)
    }
  }
}

module.exports = CoinStatsSyncer
