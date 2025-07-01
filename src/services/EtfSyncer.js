const cheerio = require('cheerio')
const { get } = require('lodash')
const { getPrevWeekday, utcDate } = require('../utils')
const sosovalue = require('../providers/sosovalue')
const Syncer = require('./Syncer')
const Etf = require('../db/models/Etf')
const EtfTotalInflow = require('../db/models/EtfTotalInflow')
const EtfDailyInflow = require('../db/models/EtfDailyInflow')

class EtfSyncer extends Syncer {
  constructor(json) {
    super()
    this.json = json
  }

  async start() {
    await this.syncLatest()
  }

  async syncLatest() {
    this.cron('1h', () => {
      this.sync('btc')
      this.sync('eth')
    })
  }

  async sync(category) {
    const date = getPrevWeekday()
    const etfs = await Etf.findAll({
      attributes: ['date', 'ticker', 'category'],
      raw: true,
      where: {
        ...(category && { category }),
      },
    })

    console.log('Syncing ETF data for', date)

    if (etfs.length) {
      const expired = await Etf.expiredItems(date)
      if (expired.length) {
        console.log('ETF data expired for', expired)
      } else {
        console.log('ETF data already synced')
        return
      }
    }

    try {
      await this.syncSpotETF(date, category)
    } catch (e) {
      console.log(e)
    }
  }

  async syncSpotETF(date, category) {
    const parsedData = this.json
      ? sosovalue.getSpotEtfJSON()
      : this.parseData(await sosovalue.getSpotEtf(category))

    const {
      data = [],
      lastData = [],
      historyData = []
    } = parsedData

    const totalNavMap = get(lastData, '[0].totalNavMap', {})
    const netInflowMap = get(lastData, '[0].netInflowMap', {})
    const cumNetInflowMap = get(lastData, '[0].cumNetInflowMap', {})
    const volumeTradedMap = get(lastData, '[0].volumeTradedMap', {})

    const etfRecords = []
    const etfInflows = []

    for (let i = 0; i < data.length; i += 1) {
      const item = data[i]

      const dailyInflow = (netInflowMap[date] || {})[item.id]
      const totalAssets = (totalNavMap[date] || {})[item.id]

      if (!dailyInflow || !totalAssets) {
        console.log(`[${item.ticker}] There is no dailyInflow or totalAssets data for (${date})`)
        console.log(`[${item.ticker}] netInflowMap`, JSON.stringify(netInflowMap))
        console.log(`[${item.ticker}] totalAssets`, JSON.stringify(totalAssets))
        continue
      }

      const totalInflow = (cumNetInflowMap[date] || {})[item.id]
      const dailyVolume = (volumeTradedMap[date] || {})[item.id]
      const etfRecord = {
        category,
        ticker: item.ticker,
        name: item.name,
        uid: item.id,
        price: item.mktPrice,
        exchange: item.exchangeName,
        institution: item.inst,
        totalAssets,
        dailyInflow,
        date
      }

      if (totalInflow) etfRecord.totalInflow = totalInflow
      if (dailyVolume) etfRecord.dailyVolume = dailyVolume

      const w1Sum = await EtfDailyInflow.getSum(utcDate({ day: -7 }, 'yyyy-MM-dd'), item.ticker, '1w')
      const m1Sum = await EtfDailyInflow.getSum(utcDate({ day: -60 }, 'yyyy-MM-dd'), item.ticker, '1m')
      const m3Sum = await EtfDailyInflow.getSum(utcDate({ day: -90 }, 'yyyy-MM-dd'), item.ticker, '3m')

      etfRecord.changes = {
        ...w1Sum,
        ...m1Sum,
        ...m3Sum
      }

      const etf = await Etf.findOne({
        where: {
          ticker: item.ticker,
        }
      })

      if (etf && dailyInflow) {
        const eftHistory = {
          etf_id: etf.id,
          dailyInflow,
          date
        }

        await this.storeDailyEtfInflow([eftHistory])
      }

      etfRecords.push(etfRecord)
    }

    for (let i = 0; i < historyData.list.length; i += 1) {
      const item = historyData.list[i]
      etfInflows.push({
        category,
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
      console.log('nameList is empty')
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

      for (let i = 0; i < arr.length; i += 1) {
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
          etf_id: parseInt(etfId, 10),
          dailyInflow: record.dailyInflow,
          dailyAssets: record.dailyAssets,
          date: new Date(timestamp * 1),
        }
      })

      await this.storeDailyEtfInflow(records)
    }
  }

  async storeEtf(records) {
    if (!records.length) {
      return
    }

    await Etf.bulkCreate(records, {
      updateOnDuplicate: ['price', 'totalAssets', 'totalInflow', 'dailyInflow', 'dailyVolume', 'changes', 'date', 'category']
    })
      .then((data) => {
        console.log('Inserted ETF', data.length)
      })
      .catch(err => {
        console.error(err)
      })
  }

  async storeTotalEtfInflow(records) {
    if (!records.length) {
      return
    }

    await EtfTotalInflow.bulkCreate(records, {
      updateOnDuplicate: ['totalAssets', 'totalInflow', 'totalDailyInflow', 'totalDailyVolume', 'category'],
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
    if (!records.length) {
      return
    }

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
