const { DateTime } = require('luxon')
const { utcDate } = require('../utils')
const coingecko = require('../providers/coingecko')
const defillama = require('../providers/defillama')
const GlobalMarket = require('../db/models/GlobalMarket')
const Syncer = require('./Syncer')
const logger = require('../config/logger')

class GlobalMarketsSyncer extends Syncer {
  async start() {
    await this.syncHistorical()
    // await this.syncLatest()
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

    await this.syncHistoricalMarkets('10m')
  }

  async syncDailyMarkets() {
    await this.syncMarkets(utcDate('yyyy-MM-dd HH:00:00', { hours: -24 }))
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
      const defiGlobalMarkets = await coingecko.getGlobalDefiMarkets()

      const tvlResponse = await defillama.getCharts()
      const tvl = tvlResponse ? tvlResponse.pop().totalLiquidityUSD : 0

      this.upsertMarkets([
        {
          date,
          marketCap: globalMarkets.data.total_market_cap.usd,
          volume: globalMarkets.data.total_volume.usd,
          btcDominance: globalMarkets.data.market_cap_percentage.btc,
          tvl,
          defiMarketCap: defiGlobalMarkets.data.defi_market_cap
        }
      ])
    } catch (e) {
      console.error(`Error fetching global markets: ${e}`)
    }
  }

  async syncHistoricalMarkets() {
    try {
      logger.info('Fetching historical global markets data ...')

      const globalMarkets = []
      const supportedChains = await this.getSupportedChains()
      const totalTvls = await this.getHistoricalTvl()
      const chainTvls = await this.getHistoricalTvl(supportedChains)
      const totalChartsData = await this.getTotalChartsData()
      const defiMarketCapDatas = await this.getDefiMarketCapData()
      const btcDominanceDatas = await this.getBtcDominanceData()
      let monthlyInterval

      for (let i = 0; i < totalTvls.length; i += 1) {
        const { date, totalLiquidityUSD } = totalTvls[i]
        const dateTime = DateTime.fromMillis(date * 1000)
        const dateTimeStr = dateTime.toFormat('yyyy-MM-dd HH:00:00')
        if (i === 0) {
          monthlyInterval = dateTime.minus({ days: 30 })
        }

        // ----------- Find Chain TVL data for date ----------------
        const chainTvl = chainTvls.find(item => item.date === date)

        // ---------- Find MarketCap and Volume data for date ------
        const marketCapData = totalChartsData.marketCapsData.find(item => item[0] === date * 1000)
        const volumeData = totalChartsData.volumesData.find(item => item[0] === date * 1000)

        // ---------- Find defiMarketCapData data for date ------
        const defiMarketCapData = defiMarketCapDatas.find(item => item[0] === date * 1000)

        // ----------- Find BTC dominance data for date ------------
        const btcDominanceData = btcDominanceDatas.find(item => item[0] === date * 1000)

        globalMarkets.push({
          date: dateTimeStr,
          marketCap: marketCapData ? marketCapData[1] : 0,
          defiMarketCap: defiMarketCapData ? defiMarketCapData[1] : 0,
          volume: volumeData ? volumeData[1] : 0,
          btcDominance: btcDominanceData ? btcDominanceData[1] : 0,
          tvl: totalLiquidityUSD,
          chainTvl: chainTvl ? chainTvl.data : null
        })

        // ---------- On date >= 30 days, break -----
        if (dateTime <= monthlyInterval) {
          break
        }
      }

      this.upsertMarkets(globalMarkets)
      logger.info('Successfully inserted historical global markets data !!!')
    } catch (e) {
      console.error(`Error fetching global markets: ${e}`)
    }
  }

  async getTotalChartsData() {
    logger.info('Fetching historical MarketCap/Volume data ...')
    const chartsData = await coingecko.getTotalChartsData()
    if (chartsData) {
      return {
        marketCapsData: chartsData.stats,
        volumesData: chartsData.total_volumes
      }
    }

    return []
  }

  async getDefiMarketCapData() {
    logger.info('Fetching historical Defi MarketCap data ...')
    const marketCapsData = await coingecko.getDefiMarketCapData()
    if (marketCapsData) {
      return marketCapsData[0].data
    }

    return []
  }

  async getBtcDominanceData() {
    logger.info('Fetching historical BTC Dominance data ...')
    const dominanceData = await coingecko.getMarketDominance()
    if (dominanceData) {
      const seriesData = dominanceData.series_data_array
      const btcData = seriesData.find(item => item.name === 'BTC')
      if (btcData) {
        return btcData.data
      }
    }

    return []
  }

  async getHistoricalTvl(supportedChains) {
    logger.info('Fetching historical TVL data ...')
    // ------ Get Global TVl values -----------
    if (!supportedChains) {
      const charts = await defillama.getCharts()
      if (charts) {
        return charts.reverse()
      }
    }

    // ------ Get TVl values for chain ---------
    let chainTvls = []
    for (let i = 0; i < supportedChains.length; i += 1) {
      const chainName = supportedChains[i]
      const chainCharts = await defillama.getChart(chainName)

      chainTvls = chainTvls.concat(
        chainCharts.map(item => ({
          date: item.date,
          data: {
            [chainName]: item.totalLiquidityUSD
          }
        }))
      )
    }
    // Merge data by uniq date value
    return chainTvls.reduce((acc, currentItem) => {
      const found = acc.find(i => i.date === currentItem.date)
      if (found) {
        found.data = { ...found.data, ...currentItem.data }
      } else {
        acc.push(currentItem)
      }

      return acc
    }, [])
  }

  async getSupportedChains() {
    logger.info('Fetching supported chains ...')
    return ['Ethereum', 'Binance', 'Solana']

    // // -- Extract Uniq Chains ------------------------
    // const protocols = await defillama.getProtocols()
    // return protocols
    //   .flatMap(i => i.chains)
    //   .reduce((acc, currentValue) => {
    //     if (!acc.includes(currentValue)) {
    //       acc.push(currentValue)
    //     }
    //     return acc
    //   }, [])
  }

  upsertMarkets(markets) {
    GlobalMarket.bulkCreate(markets, {
      updateOnDuplicate: ['marketCap', 'defiMarketCap', 'volume', 'btcDominance']
    })
      .then(result => {
        console.log(JSON.stringify(`Inserted ${result.length} global markets data`))
      })
      .catch(err => {
        console.error('Error inserting global markets', err.message)
      })
  }
}

module.exports = GlobalMarketsSyncer
