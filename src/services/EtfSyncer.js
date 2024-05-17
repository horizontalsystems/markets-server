const cheerio = require('cheerio')
const { get } = require('lodash')
const { getPrevWeekday } = require('../utils')
const sosovalue = require('../providers/sosovalue')
const Syncer = require('./Syncer')
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
    const date = getPrevWeekday()
    const etfs = await Etf.findAll({ attributes: ['date', 'ticker'], raw: true })

    console.log('Syncing ETF data for', date)

    if (etfs.length) {
      const expired = etfs.filter(item => item.date < date)
      if (expired.length) {
        console.log('ETF data expired for', expired)
      } else {
        console.log('ETF data already synced')
        return
      }
    }

    try {
      await this.syncSpotETF(date)
    } catch (e) {
      console.log(e)
    }
  }

  async syncSpotETF(date) {
    const {
      data = [],
      lastData = [],
      historyData = []
    } = this.parseData(await sosovalue.getSpotEtf())

    const totalNavMap = get(lastData, '[0].totalNavMap', {})
    const netInflowMap = get(lastData, '[0].netInflowMap', {})
    const cumNetInflowMap = get(lastData, '[0].cumNetInflowMap', {})
    const volumeTradedMap = get(lastData, '[0].volumeTradedMap', {})

    const etfRecords = []
    const etfInflows = []

    for (let i = 0; i < data.length; i += 1) {
      const item = data[i]

      const etf = {
        ticker: item.ticker,
        name: item.name,
        uid: item.id,
        price: item.mktPrice,
        totalAssets: (totalNavMap[date] || {})[item.id],
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
      updateOnDuplicate: ['price', 'totalAssets', 'totalInflow', 'dailyInflow', 'dailyVolume']
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
