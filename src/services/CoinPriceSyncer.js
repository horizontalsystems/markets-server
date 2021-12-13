const { chunk } = require('lodash')
const utils = require('../utils')
const coingecko = require('../providers/coingecko')
const Coin = require('../db/models/Coin')

const debug = msg => {
  console.log(new Date(), msg)
}

class CoinPriceSyncer {

  async start() {
    const running = true
    while (running) {
      try {
        await this.sync()
      } catch (e) {
        debug(e)
        process.exit(1)
      }
    }
  }

  async sync() {
    const coins = await Coin.findAll({ attributes: ['uid'] })
    const chunks = chunk(coins.map(item => item.uid), 400)

    for (let i = 0; i < chunks.length; i += 1) {
      await this.syncCoins(chunks[i])
    }
  }

  async syncCoins(coinIds) {
    debug(`Syncing coins ${coinIds.length}`)

    try {
      const coins = await coingecko.getMarkets(coinIds)
      await this.updateCoins(coins)
      await utils.sleep(1200)
    } catch ({ message, response = {} }) {
      if (message) {
        console.error(message)
      }

      if (response.status === 429) {
        debug(`Sleeping 1min; Status ${response.status}`)
        await utils.sleep(60000)
      }

      if (response.status >= 502 && response.status <= 504) {
        debug(`Sleeping 30s; Status ${response.status}`)
        await utils.sleep(30000)
      }
    }
  }

  async updateCoins(coins) {
    debug(`Synced coins: ${coins.length}`)

    const values = coins.map(item => {
      if (!item.uid || !item.price) {
        return null
      }

      return [
        item.uid,
        item.price,
        JSON.stringify(item.price_change),
        JSON.stringify(item.market_data),
        item.last_updated
      ]
    })

    try {
      await Coin.updateCoins(values.filter(item => item))
      debug(`Updated coins ${coins.length}`)
    } catch (e) {
      debug(e)
    }
  }

}

module.exports = CoinPriceSyncer
