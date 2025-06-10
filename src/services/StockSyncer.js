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
    const periodFrom = utcStartOfDay({ days: -30 }, true)
    const periodTo = utcStartOfDay({}, true)

    for (let i = 0; i < stocks.length; i += 1) {
      const stock = stocks[i];
      console.log('Fetching stock price for', stock.name)

      try {
        const { price, prices } = await yahoo.getPriceByRange(stock.symbol, periodFrom, periodTo)

        const price30d = prices[0]
        const price7d = prices[prices.length - 7]
        const price1d = prices[prices.length - 1]

        const priceChange = {
          '30d': percentageChange(price30d.price, price),
          '7d': percentageChange(price7d.price, price),
          '1d': percentageChange(price1d.price, price)
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
