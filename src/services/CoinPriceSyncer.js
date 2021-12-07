const { CronJob } = require('cron')
const utils = require('../utils')
// const logger = require('../config/logger')
const coingecko = require('../providers/coingecko')
const Coin = require('../db/models/Coin')

class CoinPriceSyncer {

  constructor() {
    this.cron = new CronJob({
      cronTime: '* * * * * *', // every second
      onTick: this.syncSchedule.bind(this),
      start: false
    })
  }

  start() {
    console.log('start')
    this.cron.start()
  }

  pause() {
    console.log('pause')
    this.cron.stop()
  }

  async syncSchedule() {
    console.log('Sync schedule started')
    this.pause()

    const coins = await Coin.findAll({ attributes: ['uid'] })
    await this.syncCoins(coins.map(item => item.uid))

    this.start()
  }

  async syncCoins(coinIds) {
    console.log(`Syncing coins ${coinIds.length}`)
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
      console.log(`Fetching coins ${coinIds.length}`)
      return await coingecko.getMarkets(coinIds)
    } catch ({ message, response = {} }) {
      if (message) {
        console.error(message)
      }

      if (response.status === 429) {
        console.log(`Sleeping 1min; Status ${response.status}`)
        await utils.sleep(60000)
      }

      if (response.status >= 502 && response.status <= 504) {
        console.log(`Sleeping 30s; Status ${response.status}`)
        await utils.sleep(30000)
      }

      return []
    }
  }

  async updateCoins(coins) {
    console.log(`Synced coins: ${coins.length}`)

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
      console.log('Updated coins', coins.length)
    } catch (e) {
      console.log(e)
    }
  }

}

module.exports = CoinPriceSyncer
