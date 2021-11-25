const { CronJob } = require('cron')
const utils = require('../utils')
const logger = require('../config/logger')
const coingecko = require('../providers/coingecko')
const Coin = require('../db/models/Coin')

class CoinSyncer {

  constructor() {
    this.cron = new CronJob({
      cronTime: '* * * * * *', // every second
      onTick: this.syncSchedule.bind(this),
      start: false
    })
  }

  start() {
    this.cron.start()
  }

  pause() {
    this.cron.stop()
  }

  async syncSchedule() {
    this.pause()

    const coins = await Coin.findAll({ attributes: ['uid'] })
    await this.syncCoins(coins.map(item => item.uid))

    this.start()
  }

  async syncCoins(coinIds) {
    logger.info(`Syncing coins ${coinIds.length}`)
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
      logger.info(`Fetching coins ${coinIds.length}`)
      return await coingecko.getMarkets(coinIds)
    } catch ({ message, response }) {
      if (message) {
        console.error(message)
      }

      if (response && response.status === 429) {
        logger.info('Sleeping 30s')
        await utils.sleep(30000)
      }

      return []
    }
  }

  async updateCoins(coins) {
    logger.info(`Synced coins: ${coins.length}`)

    const values = coins.map(item => [
      item.uid,
      item.price,
      JSON.stringify(item.price_change),
      JSON.stringify(item.market_data),
      item.last_updated
    ])

    try {
      await Coin.updateCoins(values)
    } catch (e) {
      console.log(e)
    }
  }

}

module.exports = CoinSyncer
