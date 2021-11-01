const { DateTime } = require('luxon')
const coingecko = require('../providers/coingecko')
const defillama = require('../providers/defillama')
const GlobalMarket = require('../db/models/GlobalMarket')
const Syncer = require('./Syncer')
const { sleep } = require('../utils')
const logger = require('../config/logger')

class GlobalMarketsSyncer extends Syncer {

  async start() {
    await this.syncLatest()
  }

  async syncLatest() {
    this.cron('1h', this.syncDailyMarkets)
    this.cron('4h', this.syncWeeklyStats)
    this.cron('1d', this.syncMonthlyStats)
  }

  async syncDailyMarkets() {
    await this.syncMarkets(DateTime.utc())
  }

  async syncWeeklyStats(dateParams) {
    await this.adjustPoints(dateParams.dateFrom, dateParams.dateTo)
  }

  async syncMonthlyStats(dateParams) {
    await this.adjustPoints(dateParams.dateFrom, dateParams.dateTo)
  }

  async adjustPoints(dateFrom, dateTo) {
    await GlobalMarket.deleteExpired(dateFrom, dateTo)
  }

  async syncMarkets(date) {
    try {

      logger.info('Fetching global markets data ...')

      const globalMarkets = await coingecko.getGlobalMarkets()
      await sleep(1000) // Wait to bypass CoinGecko limitations

      const defiGlobalMarkets = await coingecko.getGlobalDefiMarkets()

      const tvlResponse = await defillama.getCharts()
      const tvl = tvlResponse ? tvlResponse.pop().totalLiquidityUSD : 0

      this.upsertMarkets({
        date,
        marketCap: globalMarkets.data.total_market_cap.usd,
        volume: globalMarkets.data.total_volume.usd,
        btcDominance: globalMarkets.data.market_cap_percentage.btc,
        tvl,
        defiMarketCap: defiGlobalMarkets.data.defi_market_cap
      })
    } catch (e) {
      console.error(`Error fetching global markets: ${e}`)
    }
  }

  upsertMarkets(marketsData) {
    GlobalMarket.upsert(marketsData)
      .then(([result]) => {
        console.log(JSON.stringify(result.dataValues))
      })
      .catch((err) => {
        console.error('Error inserting global markets', err.message)
      })
  }
}

module.exports = GlobalMarketsSyncer
