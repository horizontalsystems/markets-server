const cheerio = require('cheerio')
const { get } = require('lodash')
const { utcDate } = require('../utils')
const Syncer = require('./Syncer')
const sosovalue = require('../providers/sosovalue')
const Etf = require('../db/models/Etf')
const EtfInflow = require('../db/models/EtfInflow')

class EtfSyncer extends Syncer {
  async start() {
    await this.syncLatest()
  }

  async syncLatest() {
    this.cron('1h', this.sync)
  }

  async sync() {
    const dateFrom = utcDate({}, 'yyyy-MM-dd')
    console.log('Sync ETF data of', dateFrom)
    const etfs = await Etf.expiredItems(dateFrom)
    if (!etfs.length) {
      console.log('ETF data already synced')
      return
    }

    const {
      data = [],
      lastData = [],
      historyData = []
    } = this.parseData(await sosovalue.getSpotEtf())

    const netInflowMap = get(lastData, '[0].netInflowMap', {})
    const cumNetInflowMap = get(lastData, '[0].cumNetInflowMap', {})
    const volumeTradedMap = get(lastData, '[0].volumeTradedMap', {})
    const date = Object.keys(netInflowMap)[0]

    const etfRecords = []
    const etfInflows = []

    for (let i = 0; i < data.length; i += 1) {
      const item = data[i]

      const etf = {
        ticker: item.ticker,
        name: item.name,
        uid: item.id,
        price: item.mktPrice,
        totalInflow: (cumNetInflowMap[date] || {})[item.id],
        dailyInflow: (netInflowMap[date] || {})[item.id],
        dailyVolume: (volumeTradedMap[date] || {})[item.id],
        date
      }

      etfRecords.push(etf)
    }

    for (let i = 0; i < historyData.list.length; i += 1) {
      const item = historyData.list[i]
      etfInflows.push({
        date: item.dataDate,
        totalAssets: item.totalNetAssets,
        totalInflow: item.cumNetInflow,
        totalDailyInflow: item.totalNetInflow,
        totalDailyVolume: item.totalVolume
      })
    }

    await this.storeEtf(etfRecords)
    await this.storeEtfInflow(etfInflows)
  }

  async storeEtf(records) {
    await Etf.bulkCreate(records, {
      updateOnDuplicate: ['price', 'totalInflow', 'dailyInflow', 'dailyVolume',]
    })
      .then((data) => {
        console.log('Inserted ETF', data.length)
      })
      .catch(err => {
        console.error(err)
      })
  }

  async storeEtfInflow(records) {
    await EtfInflow.bulkCreate(records, {
      updateOnDuplicate: ['totalAssets', 'totalInflow', 'totalDailyInflow', 'totalDailyVolume'],
      returning: false
    })
      .then((data) => {
        console.log('Inserted ETF inflow', data.length)
      })
      .catch(err => {
        console.error(err)
      })
  }

  parseData(data) {
    const $ = cheerio.load(data)
    const element = $('script#__NEXT_DATA__')[0]
    const children = element && element.children && element.children[0]

    if (!children || !children.data) {
      return {}
    }

    const { props: { pageProps } } = JSON.parse(children.data)
    return pageProps
  }

}

module.exports = EtfSyncer
