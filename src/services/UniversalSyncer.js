const Syncer = require('./Syncer')

const GlobalMarketsSyncer = require('./GlobalMarketsSyncer')
const CurrencyRateSyncer = require('./CurrencyRateSyncer')
const CoinPriceSyncer = require('./CoinPriceSyncer')
const utils = require('../utils')

const globalMarketsSyncer = new GlobalMarketsSyncer()
const currencyRateSyncer = new CurrencyRateSyncer()
const coinPriceSyncer = new CoinPriceSyncer(true)

const debug = msg => console.log(new Date(), msg)

class UniversalSyncer extends Syncer {

  constructor() {
    super()

    this.cron('10m', () => {
      this.syncCurrencyRates = true
      this.syncGlobalMarkets = true
    })

    this.cron('1d', globalMarketsSyncer.syncMonthlyStats)
    this.cron('1h', currencyRateSyncer.adjustPrevDayPoints)
    this.cron('1d', currencyRateSyncer.adjustQuarterPoints)
  }

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
    if (this.syncCurrencyRates) {
      console.log('syncCurrencyRates')
      await currencyRateSyncer.syncDailyRates()
      await utils.sleep(8000)
    }

    if (this.syncGlobalMarkets) {
      console.log('syncGlobalMarkets')
      await globalMarketsSyncer.syncLatestMarkets(utils.utcDate({}))
      await utils.sleep(8000)
    }

    await coinPriceSyncer.sync()
  }
}

module.exports = UniversalSyncer
