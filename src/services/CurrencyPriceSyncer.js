const { DateTime } = require('luxon')
const coingecko = require('../providers/coingecko')
const CurrencyPrice = require('../db/models/CurrencyPrice')
const Currency = require('../db/models/Currency')
const Syncer = require('./Syncer')

class CurrencyPriceSyncer extends Syncer {

  async start() {
    await this.syncHistorical()
    await this.syncLatest()
  }

  async syncHistorical() {
    if (await CurrencyPrice.exists()) {
      return
    }

    await this.syncHistoricalPrices('10m')
    await this.syncHistoricalPrices('90d')
  }

  async syncLatest() {
    this.cron('10m', this.syncDailyPrices)
    this.cron('1h', this.syncNinetyDaysPrices)
    this.cron('1d', this.syncQuarterPrices)
  }

  async clearExpired() {
    await CurrencyPrice.deleteExpired()
  }

  async syncDailyPrices() {
    const dateExpiresIn = { hours: 24 }
    const date = DateTime.utc()

    await this.syncPrices(date, dateExpiresIn)
    await this.clearExpired()
  }

  async syncNinetyDaysPrices() {
    const dateExpiresIn = { days: 90 }
    const date = DateTime.utc()

    await this.syncPrices(date, dateExpiresIn)
  }

  async syncQuarterPrices() {
    const date = DateTime.utc()

    await this.syncPrices(date)
  }

  async syncPrices(date, dateExpiresIn) {
    const sourceCoin = 'tether'
    const currencies = await this.getCurrencies()
    const pricesResponse = await coingecko.getLatestCoinPrice([sourceCoin], currencies.codes)
    const expiresAt = dateExpiresIn ? date.plus(dateExpiresIn) : null

    const prices = currencies.codes.map(code => ({
      date,
      currencyId: currencies.idsMap[code],
      price: pricesResponse[sourceCoin][code],
      expires_at: expiresAt
    }))

    this.upsertCurrencyPrices(prices)
  }

  async syncHistoricalPrices(period) {
    const sourceCoin = 'tether'
    const currencies = await this.getCurrencies()
    const prices = []

    const dateParams = period === '10m' ? {
      dateFrom: DateTime.utc().plus({ hours: -24 }),
      dateTo: DateTime.utc(),
      dateExpiresIn: { hours: 24 }
    } : {
      dateFrom: DateTime.utc().plus({ days: -90 }),
      dateTo: DateTime.utc().plus({ days: -1 }),
      dateExpiresIn: { days: 90 }
    }

    // eslint-disable-next-line guard-for-in,no-restricted-syntax
    for (const code of currencies.codes) {
      const marketsChart = await coingecko.getMarketsChart(
        sourceCoin,
        code,
        dateParams.dateFrom.toMillis() / 1000,
        dateParams.dateTo.toMillis() / 1000
      )

      marketsChart.prices.forEach(priceData => {

        const date = DateTime.fromMillis(priceData[0])

        prices.push({
          date,
          currencyId: currencies.idsMap[code],
          price: priceData[1],
          expires_at: date.plus(dateParams.dateExpiresIn)
        })
      })

      await new Promise(r => setTimeout(r, 1000));
    }

    this.upsertCurrencyPrices(prices)
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

  upsertCurrencyPrices(prices) {
    CurrencyPrice.bulkCreate(prices, {
      updateOnDuplicate: ['price', 'currencyId']
    }).then(([result]) => {
      console.log(JSON.stringify(result.dataValues))
    }).catch(err => {
      console.error('Error inserting currency prices', err.message)
    })
  }
}

module.exports = CurrencyPriceSyncer
