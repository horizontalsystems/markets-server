const yahoo = require('../providers/yahoo')
const Stock = require('../db/models/Stock')
const CoinPriceHistorySyncer = require('./CoinPriceHistorySyncer')
const { utcStartOfDay, percentageChange } = require('../utils')

class StockSyncer extends CoinPriceHistorySyncer {
  async start() {
    this.cron('4h', () => this.sync())
  }

  async sync() {
    const stocks = await Stock.findAll({ raw: true })
    const periodFrom = utcStartOfDay({ years: -5 }, true)
    const periodTo = utcStartOfDay({}, true)

    for (let i = 0; i < stocks.length; i += 1) {
      const stock = stocks[i];
      console.log('Fetching stock price for', stock.name)

      try {
        const { price, prices, timestamps } = await yahoo.getPriceByRange(stock.symbol, periodFrom, periodTo)

        const periodsMap = {}
        const periodTime = {
          '1d': utcStartOfDay({ days: -1 }, true),
          '7d': utcStartOfDay({ days: -7 }, true),
          '30d': utcStartOfDay({ days: -30 }, true),
          '90d': utcStartOfDay({ days: -90 }, true),
          '200d': utcStartOfDay({ days: -200 }, true),
          '1y': utcStartOfDay({ years: -1, day: 5 }, true),
          '2y': utcStartOfDay({ years: -2, day: 5 }, true),
          '3y': utcStartOfDay({ years: -3, day: 5 }, true),
          '4y': utcStartOfDay({ years: -4, day: 5 }, true),
          '5y': utcStartOfDay({ years: -5, day: 5 }, true),
        }

        for (let t = 0; t < timestamps.length; t += 1) {
          const timestamp = timestamps[t]
          const currPrice = prices[t]

          if (!timestamp || !currPrice) continue
          if (timestamp <= periodTime['1d']) periodsMap['1d'] = currPrice
          if (timestamp <= periodTime['7d']) periodsMap['7d'] = currPrice
          if (timestamp <= periodTime['30d']) periodsMap['30d'] = currPrice
          if (timestamp <= periodTime['90d']) periodsMap['90d'] = currPrice
          if (timestamp <= periodTime['200d']) periodsMap['200d'] = currPrice
          if (timestamp <= periodTime['1y']) periodsMap['1y'] = currPrice
          if (timestamp <= periodTime['2y']) periodsMap['2y'] = currPrice
          if (timestamp <= periodTime['3y']) periodsMap['3y'] = currPrice
          if (timestamp <= periodTime['4y']) periodsMap['4y'] = currPrice
          if (timestamp <= periodTime['5y']) periodsMap['5y'] = currPrice
        }

        const priceChange = {
          '1d': percentageChange(periodsMap['1d'], price),
          '7d': percentageChange(periodsMap['7d'], price),
          '30d': percentageChange(periodsMap['30d'], price),
          '90d': percentageChange(periodsMap['90d'], price),
          '200d': percentageChange(periodsMap['200d'], price),
          '1y': percentageChange(periodsMap['1y'], price),
          '2y': percentageChange(periodsMap['2y'], price),
          '3y': percentageChange(periodsMap['3y'], price),
          '4y': percentageChange(periodsMap['4y'], price),
          '5y': percentageChange(periodsMap['5y'], price),
        }

        await this.upsert(stock.symbol, price, priceChange)
      } catch (e) {
        console.log(`Error syncing stock price for ${stock.name}`, e)
      }
    }
  }

  async upsert(symbol, price, priceChange) {
    if (!price) return

    await Stock.update({ market_price: price, price_change: priceChange }, { where: { symbol } })
      .then(() => {
        console.log(`Upserted ${symbol} price: ${price}; change: ${JSON.stringify(priceChange)}`)
      }).catch(err => {
        console.error('Upsert failed:', err)
      })
  }
}

module.exports = StockSyncer
