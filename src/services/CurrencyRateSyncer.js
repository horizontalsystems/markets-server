const { DateTime } = require('luxon')
const coingecko = require('../providers/coingecko')
const CurrencyRate = require('../db/models/CurrencyRate')
const Currency = require('../db/models/Currency')
const Syncer = require('./Syncer')
const { sleep, utcDate } = require('../utils')

class CurrencyRateSyncer extends Syncer {

  async start() {
    await this.syncHistorical()
    await this.syncLatest()
  }

  async syncHistorical() {
    if (await CurrencyRate.exists()) {
      return
    }

    await this.syncHistoricalRates('10m')
    await this.syncHistoricalRates('90d')
  }

  async syncLatest() {
    this.cron('10m', this.syncDailyRates)
    this.cron('1h', this.syncNinetyDaysRates)
    this.cron('1d', this.syncQuarterRates)
  }

  async syncDailyRates() {
    const dateExpiresIn = { hours: 24 }
    const date = DateTime.utc()

    await this.syncRates(date, dateExpiresIn)
  }

  async syncNinetyDaysRates() {
    const dateFrom = utcDate('yyyy-MM-dd HH:00:00', { days: -1, hours: -1 })
    const dateTo = utcDate('yyyy-MM-dd HH:00:00', { days: -1 })

    await this.adjustPoints(dateFrom, dateTo)
  }

  async syncQuarterRates() {
    const dateFrom = utcDate('yyyy-MM-dd', { days: -91 })
    const dateTo = utcDate('yyyy-MM-dd', { days: -90 })

    await this.adjustPoints(dateFrom, dateTo)
  }

  async adjustPoints(dateFrom, dateTo) {
    await CurrencyRate.deleteExpired(dateFrom, dateTo)
  }

  async syncRates(date, dateExpiresIn) {
    const sourceCoin = 'tether'
    const currencies = await this.getCurrencies()
    const pricesResponse = await coingecko.getLatestCoinPrice([sourceCoin], currencies.codes)
    const expiresAt = dateExpiresIn ? date.plus(dateExpiresIn) : null

    const rates = currencies.codes.map(code => ({
      date,
      currencyId: currencies.idsMap[code],
      rate: pricesResponse[sourceCoin][code],
      expires_at: expiresAt
    }))

    this.upsertCurrencyRates(rates)
  }

  async syncHistoricalRates(period) {
    const sourceCoin = 'tether'
    const currencies = await this.getCurrencies()
    const rates = []

    const dateParams = period === '10m' ? {
      dateFrom: DateTime.utc().plus({ hours: -24 }),
      dateTo: DateTime.utc(),
      dateExpiresIn: { hours: 24 }
    } : {
      dateFrom: DateTime.utc().plus({ days: -90 }),
      dateTo: DateTime.utc().plus({ days: -1 }),
      dateExpiresIn: { days: 90 }
    }

    for (let index = 0; index < currencies.codes.length; index += 1) {
      const marketsChart = await coingecko.getMarketsChart(
        sourceCoin,
        currencies.codes[index],
        dateParams.dateFrom.toMillis() / 1000,
        dateParams.dateTo.toMillis() / 1000
      )

      marketsChart.prices.forEach(([timestamp, value]) => {

        const date = DateTime.fromMillis(timestamp)

        rates.push({
          date,
          currencyId: currencies.idsMap[currencies.codes[index]],
          rate: value,
          expires_at: date.plus(dateParams.dateExpiresIn)
        })
      })

      await sleep(1000) // Wait to bypass CoinGecko limitations
    }

    this.upsertCurrencyRates(rates)
  }

  async getCurrencies() {
    const codes = []
    const idsMap = {}
    const currencies = await Currency.findAll()

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
