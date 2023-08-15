const { DateTime } = require('luxon')
const { sleep, utcDate } = require('../utils')
const coingecko = require('../providers/coingecko')
const coinstats = require('../providers/coinstats')
const CurrencyRate = require('../db/models/CurrencyRate')
const Currency = require('../db/models/Currency')
const Syncer = require('./Syncer')

class CurrencyRateSyncer extends Syncer {

  async start() {
    await this.syncHistorical()
    await this.syncLatest()
  }

  async syncHistorical(currencyCodes) {

    if (!currencyCodes && await CurrencyRate.exists()) {
      return
    }

    await this.syncHistoricalRates(currencyCodes, '10m')
    await this.syncHistoricalRates(currencyCodes, '90d')
    console.log('Successfully synced histo rates !!!')
  }

  async syncLatest() {
    this.cron('10m', this.syncDailyRates)
    this.cron('1h', this.adjustPrevDayPoints)
    this.cron('1d', this.adjustQuarterPoints)
  }

  async syncDailyRates() {
    const date = DateTime.utc()
    await this.syncRates(date)
  }

  async adjustPrevDayPoints() {
    const dateFrom = utcDate({ days: -1, hours: -1 })
    const dateTo = utcDate({ days: -1 })

    await this.adjustPoints(dateFrom, dateTo)
  }

  async adjustQuarterPoints() {
    const dateFrom = utcDate({ days: -91 }, 'yyyy-MM-dd')
    const dateTo = utcDate({ days: -90 }, 'yyyy-MM-dd')

    await this.adjustPoints(dateFrom, dateTo)
  }

  async adjustPoints(dateFrom, dateTo) {
    await CurrencyRate.deleteExpired(dateFrom, dateTo)
  }

  async syncRates(date) {
    const sourceCoin = 'tether'
    const currencies = await this.getCurrencies()
    const coingeckoRates = await coingecko.getLatestCoinPrice([sourceCoin], currencies.codes)
    const coinstatsRates = await coinstats.getFiatRates()
    const fiatRates = coingeckoRates[sourceCoin]
    const rates = []

    for (let i = 0; i < currencies.codes.length; i += 1) {
      const code = currencies.codes[i]
      const currencyId = currencies.idsMap[code]
      const rate = fiatRates[code] || coinstatsRates[code]

      rates.push({ date, currencyId, rate })
    }

    this.upsertCurrencyRates(rates)
  }

  async syncHistoricalRates(currencyCodes, period) {
    const sourceCoin = 'tether'
    const rates = []

    const currencies = await this.getCurrencies(currencyCodes)

    console.log(`Started syncing histo rates for period: ${period}, for codes: ${currencyCodes || 'all'}`)

    const dateParams = period === '10m' ? {
      dateFrom: DateTime.utc().plus({ hours: -24 }),
      dateTo: DateTime.utc()
    } : {
      dateFrom: DateTime.utc().plus({ month: -12 }),
      dateTo: DateTime.utc().plus({ days: -1 })
    }

    for (let index = 0; index < currencies.codes.length; index += 1) {
      const marketsChart = await coingecko.getMarketsChart(
        sourceCoin,
        dateParams.dateFrom.toMillis() / 1000,
        dateParams.dateTo.toMillis() / 1000,
        currencies.codes[index]
      )

      marketsChart.prices.forEach(([timestamp, value]) => {
        const date = DateTime.fromMillis(timestamp)

        rates.push({
          date,
          currencyId: currencies.idsMap[currencies.codes[index]],
          rate: value
        })
      })

      await sleep(1000) // Wait to bypass CoinGecko limitations
    }

    this.upsertCurrencyRates(rates)
    console.log(`Successfully synced histo rates for period: ${period}, for codes: ${currencyCodes || 'all'}`)
  }

  async getCurrencies(currencyCodes) {
    const codes = []
    const idsMap = {}
    let currencies

    if (currencyCodes) {
      currencies = await Currency.getByCodes(currencyCodes)
    } else {
      currencies = await Currency.findAll()
    }

    currencies.forEach(({ id, code }) => {
      idsMap[code] = id
      if (code !== Currency.baseCurrency) {
        codes.push(code)
      }
    })

    return {
      codes,
      idsMap
    }
  }

  upsertCurrencyRates(rates) {
    CurrencyRate.bulkCreate(rates, {
      updateOnDuplicate: ['rate', 'currencyId']
    }).then(([result]) => {
      console.log(JSON.stringify(result.dataValues))
    }).catch(err => {
      console.error('Error inserting currency rates', err.message)
    })
  }
}

module.exports = CurrencyRateSyncer
