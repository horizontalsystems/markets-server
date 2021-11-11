const { utcDate } = require('../utils')
const coingecko = require('../providers/coingecko')
const defillama = require('../providers/defillama')
const GlobalMarket = require('../db/models/GlobalMarket')
const Syncer = require('./Syncer')

class GlobalMarketsSyncer extends Syncer {
  constructor() {
    super()

    this.chains = [
      'Ethereum',
      'Binance',
      'Solana',
      'Avalanche',
      'Terra',
      'Fantom',
      'Arbitrum',
      'Polygon'
    ]
  }

  async start() {
    await this.syncHistorical()
    await this.syncLatest()
  }

  async syncLatest() {
    this.cron('1h', this.syncDailyMarkets)
    this.cron('4h', this.syncWeeklyStats)
    this.cron('1d', this.syncMonthlyStats)
  }

  async syncHistorical() {
    if (await GlobalMarket.exists()) {
      return
    }

    await this.syncHistoricalMarkets()
  }

  async syncDailyMarkets() {
    await this.syncLatestMarkets(utcDate('yyyy-MM-dd HH:00:00Z', { hours: -24 }))
  }

  async syncWeeklyStats({ dateFrom, dateTo }) {
    await this.adjustPoints(dateFrom, dateTo)
  }

  async syncMonthlyStats({ dateFrom, dateTo }) {
    await this.adjustPoints(dateFrom, dateTo)
  }

  async adjustPoints(dateFrom, dateTo) {
    await GlobalMarket.deleteExpired(dateFrom, dateTo)
  }

  async syncLatestMarkets(date) {
    try {
      const globalMarkets = await coingecko.getGlobalMarkets()
      const defiGlobalMarkets = await coingecko.getGlobalDefiMarkets()

      const records = {
        date,
        market_cap: globalMarkets.total_market_cap.usd,
        volume: globalMarkets.total_volume.usd,
        btc_dominance: globalMarkets.market_cap_percentage.btc,
        defi_market_cap: defiGlobalMarkets.defi_market_cap
      }

      this.upsertMarkets([records], Object.keys(records))
    } catch (e) {
      console.error(`Error fetching global markets: ${e.message}`)
    }
  }

  async syncHistoricalMarkets() {
    try {
      const { marketCaps, totalVolumes } = await coingecko.getTotalChartsData()
      const { data: dominanceData = [] } = await coingecko.getMarketDominance()
      const { data: defiMarketCap = [] } = await coingecko.getDefiMarketCapData()
      const totalLiquidity = (await defillama.getCharts()).map(item => [
        item.date * 1000,
        item.totalLiquidityUSD
      ])

      const dataMap = {}
      this.mapMarketData(marketCaps, dataMap, 'market_cap', true)
      this.mapMarketData(totalVolumes, dataMap, 'volume')
      this.mapMarketData(dominanceData, dataMap, 'btc_dominance')
      this.mapMarketData(defiMarketCap, dataMap, 'defi_market_cap')
      this.mapMarketData(totalLiquidity, dataMap, 'tvl')

      for (let i = 0; i < this.chains.length; i += 1) {
        const chain = this.chains[i]
        const chainLiquidity = (await defillama.getCharts(chain)).map(item => [
          item.date * 1000,
          item.totalLiquidityUSD
        ])

        this.mapMarketData(chainLiquidity, dataMap, chain, false, true)
      }

      this.upsertMarkets(Object.entries(dataMap).map(([, data]) => data))
    } catch (e) {
      console.error(`Error fetching global markets: ${e}`)
    }
  }

  upsertMarkets(markets, updateOnDuplicate) {
    GlobalMarket.bulkCreate(markets, { updateOnDuplicate })
      .then(records => {
        console.log(`Inserted ${records.length} global markets data`)
      })
      .catch(err => {
        console.error('Error inserting global markets', err.message)
      })
  }

  mapMarketData(items, map, field, isInitial, isTvl) {
    for (let i = 0; i < items.length; i += 1) {
      const [date, value] = items[i]
      const item = map[date]

      if (item && isTvl) {
        item.chain_tvls[field] = value
      } else if (item) {
        item[field] = value
      } else if (isInitial) {
        map[date] = { date, chain_tvls: {}, [field]: value } // eslint-disable-line
      }
    }
  }
}

module.exports = GlobalMarketsSyncer
