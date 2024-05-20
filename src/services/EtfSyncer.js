const cheerio = require('cheerio')
const { get } = require('lodash')
const { getPrevWeekday } = require('../utils')
const sosovalue = require('../providers/sosovalue')
const Syncer = require('./Syncer')
const Etf = require('../db/models/Etf')
const EtfTotalInflow = require('../db/models/EtfTotalInflow')
const EtfDailyInflow = require('../db/models/EtfDailyInflow')

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
        exchange: item.exchangeName,
        institution: item.inst,
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
    await this.storeTotalEtfInflow(etfInflows)
  }

  async syncHistory(tickerName) {
    const etfs = await Etf.findAll({
      attributes: ['id', 'ticker', 'exchange'],
      where: {
        ...(tickerName && { ticker: tickerName }),
      },
      raw: true
    })

    const nameList = []
    const etfIds = {}
    const etfRecords = {}

    for (let i = 0; i < etfs.length; i += 1) {
      const item = etfs[i];
      nameList.push(`Etf_${item.exchange}_${item.ticker}_1DNetInflow`)
      nameList.push(`Etf_${item.exchange}_${item.ticker}_NetAssets`)

      etfIds[item.ticker] = item.id
      etfRecords[item.id] = {}
    }

    if (!nameList.length) {
      return
    }

    const resp = await sosovalue.findListByIdsOrNames(nameList)
    const data = Object.entries(resp)

    const mapRecords = (map, type, arr) => {
      let key
      if (type === '1DNetInflow') {
        key = 'dailyInflow'
      } else if (type === 'NetAssets') {
        key = 'dailyAssets'
      }

      for (let i = 0; i < arr.length; i++) {
        const [time, value] = arr[i]
        const item = map[time] || (map[time] = {})
        item[key] = value
      }
    }

    for (let i = 0; i < data.length; i += 1) {
      const [key, value] = data[i]
      const [, , ticker, dataType] = key.split('_')
      const etfId = etfIds[ticker]
      const etfRecord = etfRecords[etfId] || (etfRecords[etfId] = {})
      if (etfRecord) {
        mapRecords(etfRecord, dataType, JSON.parse(value))
      }
    }

    const ids = Object.keys(etfRecords)
    for (let i = 0; i < ids.length; i += 1) {
      const etfId = ids[i]
      const records = Object.entries(etfRecords[etfId]).map(([timestamp, record]) => {
        return {
          etf_id: parseInt(etfId),
          dailyInflow: record.dailyInflow,
          dailyAssets: record.dailyAssets,
          date: new Date(timestamp * 1),
        }
      })

      await this.storeDailyEtfInflow(records)
    }
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

  async storeTotalEtfInflow(records) {
    await EtfTotalInflow.bulkCreate(records, {
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

  async storeDailyEtfInflow(records) {
    await EtfDailyInflow.bulkCreate(records, {
      updateOnDuplicate: ['dailyInflow', 'dailyAssets', 'etf_id'],
      returning: false
    })
      .then((data) => {
        console.log('Inserted daily ETF inflow', data.length)
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
