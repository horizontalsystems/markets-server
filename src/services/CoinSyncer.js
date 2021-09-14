const { CronJob } = require('cron')
const coingecko = require('../providers/coingecko')
const Coin = require('../db/models/Coin')

class AddressSyncer {

  cronJob = new CronJob({
    cronTime: '*/5 * * * * *', // every 5 seconds
    onTick: this.syncSchedule.bind(this),
    start: true
  })

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

    console.log(`Syncing coins: ${coinIdsChunk.length} from ${coinIds.length}`)

    const data = await coingecko.getMarkets(coinIdsChunk)

    for (const item of data) {
      const coin = map[item.coingecko_id]
      if (coin) {
        await coin.update(item, {
          fields: [
            'price',
            'price_change_24h',
            'price_change_7d',
            'price_change_30d',
            'price_change_1y',
            'market_cap',
            'market_cap_rank',
            'total_volume',
            'total_supply',
            'max_supply',
            'circulating_supply',
            'fully_diluted_valuation',
            'high_24h',
            'low_24h',
            'ath',
            'ath_change_percentage',
            'ath_date',
            'atl',
            'atl_change_percentage',
            'atl_date',
            'last_updated'
          ]
        })
      } else {
        await Coin.create(data)
      }
    }

    console.log(`Received ${data.length}`)

    if (data.length >= (coinIdsChunk.length + coinIds.length) || coinIds.length < 1) {
      return
    }

    await this.syncCoins(coinIds, map)
  }

}

module.exports = AddressSyncer
