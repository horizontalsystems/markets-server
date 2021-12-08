const { CronJob } = require('cron')
const utils = require('../utils')
// const logger = require('../config/logger')
const coingecko = require('../providers/coingecko')
const Coin = require('../db/models/Coin')

const debug = msg => {
  console.log(new Date(), msg)
}

class CoinPriceSyncer {

  constructor() {
    this.cron = new CronJob({
      cronTime: '* * * * * *', // every second
      onTick: this.syncSchedule.bind(this),
      start: false
    })
  }

  start() {
    debug('start')
    this.cron.start()
  }

  pause() {
    debug('pause')
    this.cron.stop()
  }

  async syncSchedule() {
    debug('Sync schedule started')
    this.pause()

    const coins = await Coin.findAll({ attributes: ['uid'] })
    await this.syncCoins(coins.map(item => item.uid))

    this.start()
  }

  async syncCoins(coinIds) {
    debug(`Syncing coins ${coinIds.length}`)
    const coinIdsPerPage = coinIds.splice(0, 400)

    const coins = await this.fetchCoins(coinIdsPerPage)
    await this.updateCoins(coins)

    if (coins.length >= (coinIdsPerPage.length + coinIds.length) || coinIds.length < 1) {
      return
    }

    await utils.sleep(1200)
    await this.syncCoins(coinIds)
  }

  async fetchCoins(coinIds) {
    try {
      debug(`Fetching coins ${coinIds.length}`)
      return await coingecko.getMarkets(coinIds)
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

      return []
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
