const coingecko = require('../providers/coingecko')
const defillama = require('../providers/defillama')
const GlobalMarket = require('../db/models/GlobalMarket')
const Syncer = require('./Syncer')
const utils = require('../utils')

class GlobalMarketsSyncer extends Syncer {

  async start() {
    await this.syncHistorical()
    await this.syncLatest()
  }

  async syncLatest() {
    this.cron('1h', this.syncDailyStats)
    this.cron('4h', this.syncWeeklyStats)
    this.cron('1d', this.syncMonthlyStats)
  }

  async syncHistorical() {
    if (await GlobalMarket.exists()) {
      return
    }

    await this.syncHistoricalMarkets()
  }

  async syncDailyStats({ dateTo }) {
    await this.syncLatestMarkets(dateTo)
  }

  async syncWeeklyStats({ dateFrom, dateTo }) {
    await GlobalMarket.deleteExpired(dateFrom, dateTo)
  }

  async syncMonthlyStats({ dateFrom, dateTo }) {
    await GlobalMarket.deleteExpired(dateFrom, dateTo)
  }

  async syncLatestMarkets(date, retry = 0) {
    if (retry >= 3) {
      return
    }

    try {
      const globalMarkets = await coingecko.getGlobalMarkets()
      const defiGlobalMarkets = await coingecko.getGlobalDefiMarkets()
      const protocols = await defillama.getProtocols()

      const record = {
        date,
        tvl: 0,
        chain_tvls: {},
        market_cap: globalMarkets.total_market_cap.usd,
        volume: globalMarkets.total_volume.usd,
        btc_dominance: globalMarkets.market_cap_percentage.btc,
        defi_market_cap: defiGlobalMarkets.defi_market_cap
      }

      for (let i = 0; i < protocols.length; i += 1) {
        const protocol = protocols[i]
        record.tvl += protocol.tvl
        Object.keys(protocol.chainTvls).forEach(chain => {
          const tvl = protocol.chainTvls[chain]
          const chainTvl = record.chain_tvls[chain] || 0
          record.chain_tvls[chain] = chainTvl + tvl
        })
      }

      await GlobalMarket.upsert(record).catch(console.error)
    } catch (e) {
      if (e.response) {
        console.log(`Retrying due to error ${e.message}; Retry count ${retry + 1}`)
        await utils.sleep(1000)
        await this.syncLatestMarkets(date, retry + 1)
      } else {
        console.error(e)
      }
    }
  }

  async syncHistoricalMarkets() {
    try {
      const { marketCaps, totalVolumes } = await coingecko.getTotalChartsData()
      const { data: dominanceData = [] } = await coingecko.getMarketDominance()
      const { data: defiMarketCap = [] } = await coingecko.getDefiMarketCapData()

      const supportedChains = await this.getSupportedChains()
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

      for (let i = 0; i < supportedChains.length; i += 1) {
        const chain = supportedChains[i]
        const chainLiquidity = (await defillama.getCharts(chain)).map(item => [
          item.date * 1000,
          item.totalLiquidityUSD
        ])

        this.mapMarketData(chainLiquidity, dataMap, chain, false, true)
      }

      await GlobalMarket.bulkCreate(Object.values(dataMap))
        .then(records => {
          console.log(`Inserted ${records.length} global markets data`)
        })
        .catch(console.error)
    } catch (e) {
      console.error(e)
    }
  }

  async getSupportedChains() {
    let protocols = []
    try {
      protocols = await defillama.getProtocols()
    } catch (e) {
      console.log(e)
    }

    return [...new Set(protocols.flatMap(item => item.chains))]
  }

  mapMarketData(items = [], map, field, isInitial, isTvl) {
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
