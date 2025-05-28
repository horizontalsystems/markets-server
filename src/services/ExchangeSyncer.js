const utils = require('../utils')
const coingecko = require('../providers/coingecko')
const Exchange = require('../db/models/Exchange')
const CoinPriceHistorySyncer = require('./CoinPriceHistorySyncer')

class ExchangeSyncer extends CoinPriceHistorySyncer {
  constructor() {
    super()
    this.fullSyncInProgress = false
  }

  async start() {
    this.cron('1d', () => this.syncFull())

    const running = true
    while (running) {
      try {
        if (!this.fullSyncInProgress) {
          await this.syncBasic()
        } else {
          console.log('Full sync in progress — skipping basic sync for now...')
        }

        await utils.sleep(60 * 1000) // Check every 60 seconds
      } catch (e) {
        console.error(e)
        process.exit(1)
      }
    }
  }

  async syncBasic(page = 1) {
    console.log(`Basic sync in progress — page ${page}`)
    const perPage = 250
    const exchanges = await coingecko.getExchanges(page, perPage)
    await this.upsert(exchanges)

    if (exchanges.length < perPage || this.fullSyncInProgress) {
      return
    }

    await utils.sleep(20000)
    return this.syncBasic(page + 1)
  }

  async syncFull() {
    this.fullSyncInProgress = true
    console.log('Starting full sync...')

    const exchanges = await Exchange.findAll({ attributes: ['id'], raw: true })
    for (let i = 0; i < exchanges.length; i += 1) {
      const { id } = exchanges[i]

      try {
        const exchange = await coingecko.getExchange(id)
        console.log(exchange)
        await Exchange.update(
          {
            centralized: exchange.centralized,
            trust_score: exchange.trust_score,
            trust_score_rank: exchange.trust_score_rank,
            volume_24h_btc: exchange.trade_volume_24h_btc
          },
          { where: { id } }
        )
      } catch (err) {
        console.warn(`Failed to update ${id}: ${err.message}`)
      } finally {
        await utils.sleep(20000)
      }
    }

    console.log('Full sync complete.')
    this.fullSyncInProgress = false
  }

  async upsert(exchanges) {
    const values = exchanges.map(exchange => ({
      id: exchange.id,
      name: exchange.name,
      url: exchange.url,
      image: exchange.image,
      trust_score: exchange.trust_score,
      trust_score_rank: exchange.trust_score_rank,
      volume_24h_btc: exchange.trade_volume_24h_btc,
    }))

    await Exchange.bulkCreate(values, { updateOnDuplicate: ['id'] })
      .then(() => {
        console.log(`Upserted ${values.length} exchanges`)
      }).catch(err => {
        console.error('Upsert failed:', err)
      })
  }
}

module.exports = ExchangeSyncer
