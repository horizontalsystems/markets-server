const { CronJob } = require('cron')
const { sleep } = require('../utils')
const logger = require('../config/logger')
const coingecko = require('../providers/coingecko')
const Coin = require('../db/models/Coin')

class CoinSyncer {

  constructor() {
    this.cronJob = new CronJob({
      cronTime: '*/1 * * * * *', // every second
      onTick: this.syncSchedule.bind(this),
      start: false
    })
  }

  start() {
    this.cronJob.start()
  }

  async syncSchedule() {
    this.cronJob.stop()

    const coins = await Coin.findAll({
      attributes: ['id', 'coingecko_id']
    })

    const ids = []
    const map = {}
    coins.forEach(coin => {
      ids.push(coin.coingecko_id)
      map[coin.coingecko_id] = coin
    })

    await this.syncCoins(ids, map)

    // Schedule cron task
    this.cronJob.start()
  }

  async syncCoins(coinIds, map) {
    const perPage = 500
    const coinIdsChunk = coinIds.splice(0, perPage)

    logger.info(`Syncing coins: ${coinIdsChunk.length} from ${coinIds.length}`)

    const data = await this.fetchCoins(coinIdsChunk)

    console.info(`Synced coins: ${data.length}`)

    this.upsertCoins(data, map)

    if (data.length >= (coinIdsChunk.length + coinIds.length) || coinIds.length < 1) {
      return
    }

    await sleep(1100)
    await this.syncCoins(coinIds, map)
  }

  async fetchCoins(coinIds) {
    try {
      return await coingecko.getMarkets(coinIds)
    } catch (err) {
      logger.error(err)

      if (err.response && err.response.status === 429) {
        logger.info('sleeping 30s')
        await sleep(30000)
      }

      return []
    }
  }

  upsertCoins(data, map) {
    const updateFields = {
      fields: [
        'price',
        'price_change',
        'market_data',
        'security',
        'last_updated'
      ]
    }

    for (let key = 0; key < data.length; key += 1) {
      const item = data[key];
      const coin = map[item.coingecko_id]

      if (coin) {
        coin.update(item, updateFields).catch(err => {
          logger.error(err)
        })
      } else {
        Coin.create(data).catch(err => {
          console.error(err)
        })
      }
    }
  }

}

module.exports = CoinSyncer
