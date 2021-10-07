const { CronJob } = require('cron')
const { DateTime } = require('luxon')
const coingecko = require('../providers/coingecko')
const CurrencyPrice = require('../db/models/CurrencyPrice')
const Currency = require('../db/models/Currency')

class CurrencyPriceSyncer {

  constructor() {
    this.tenMinuteCronJob = new CronJob({
      cronTime: '0 */10 * * * *', // every 10 minutes
      onTick: this.syncDailyPrices.bind(this),
      start: false
    })

    this.hourlyCronJob = new CronJob({
      cronTime: '0 * * * *', // every hour
      onTick: this.syncWeeklyPrices.bind(this),
      start: false
    })

    this.dailyCronJob = new CronJob({
      cronTime: '0 0 * * *', // every day
      onTick: this.syncMonthlyPrices.bind(this),
      start: false
    })
  }

  async start() {
    this.tenMinuteCronJob.start()
    this.hourlyCronJob.start()
    this.dailyCronJob.start()
  }

  async clearExpired() {
    await CurrencyPrice.deleteExpired()
  }

  async syncDailyPrices() {
    const dateExpiresIn = { hours: 24 }
    const date = DateTime.utc()
      .minus({ hours: 1 })
      .toFormat('yyyy-MM-dd HH:mm:00')

    await this.syncPrices(date, dateExpiresIn)
    await this.clearExpired()
  }

  async syncWeeklyPrices() {
    const dateExpiresIn = { days: 7 }
    const dateFrom = DateTime.utc()
      .minus({ days: 1 }) /* -1 day because it's data synced by daily syncer */
      .toFormat('yyyy-MM-dd HH:00:00')

    await this.syncPrices(dateFrom, dateExpiresIn)
  }

  async syncMonthlyPrices() {
    const dateExpiresIn = { days: 30 }
    const dateFrom = DateTime.utc()
      .minus({ days: 7 }) /* -7 day because it's data synced by weekly syncer */
      .toFormat('yyyy-MM-dd')

    await this.syncPrices(dateFrom, dateExpiresIn)
  }

  async syncPrices(date, dateExpiresIn) {
    const sourceCoin = 'tether'
    const currencies = await this.getCurrencies()
    const pricesResponse = await coingecko.getCoinPrice([sourceCoin], currencies.codes)
    const expiresAt = DateTime.utc()
      .plus(dateExpiresIn)
      .toFormat('yyyy-MM-dd HH:mm:00')

    const prices = currencies.codes.map(code => ({
      date,
      targetCurrencyId: currencies.idsMap[code],
      price: pricesResponse[sourceCoin][code],
      expires_at: expiresAt
    }))

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
      updateOnDuplicate: ['price', 'targetCurrencyId']
    }).then(([result]) => {
      console.log(JSON.stringify(result.dataValues))
    }).catch(err => {
      console.error('Error inserting currency prices', err.message)
    })
  }
}

module.exports = CurrencyPriceSyncer
