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
    const periodFrom = utcStartOfDay({ days: -365 }, true)
    const periodTo = utcStartOfDay({}, true)

    for (let i = 0; i < stocks.length; i += 1) {
      const stock = stocks[i];
      console.log('Fetching stock price for', stock.name)

      try {
        const { price, prices, timestamps } = await yahoo.getPriceByRange(stock.symbol, periodFrom, periodTo)

        const periodsMap = {}
        const periodTime = {
          '7d': utcStartOfDay({ days: -7 }, true),
          '30d': utcStartOfDay({ days: -30 }, true),
          '90d': utcStartOfDay({ days: -90 }, true),
          '200d': utcStartOfDay({ days: -200 }, true),
          '1y': utcStartOfDay({ days: -360 }, true)
        }

        for (let t = 0; t < timestamps.length; t += 1) {
          const timestamp = timestamps[t]
          const currPrice = prices[t]

          if (!timestamp || !currPrice) continue
          if (timestamp <= periodTime['7d']) periodsMap['7d'] = currPrice
          if (timestamp <= periodTime['30d']) periodsMap['30d'] = currPrice
          if (timestamp <= periodTime['90d']) periodsMap['90d'] = currPrice
          if (timestamp <= periodTime['200d']) periodsMap['200d'] = currPrice
          if (timestamp <= periodTime['1y']) periodsMap['1y'] = currPrice
        }

        const priceChange = {
          '7d': percentageChange(periodsMap['7d'], price),
          '30d': percentageChange(periodsMap['30d'], price),
          '90d': percentageChange(periodsMap['90d'], price),
          '200d': percentageChange(periodsMap['200d'], price),
          '1y': percentageChange(periodsMap['1y'], price),
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
