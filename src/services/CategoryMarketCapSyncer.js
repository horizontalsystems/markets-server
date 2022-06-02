const Syncer = require('./Syncer')
const Category = require('../db/models/Category')
const CategoryMarketCap = require('../db/models/CategoryMarketCap')
const { utcDate, percentageChange } = require('../utils')

class CategoryMarketCapSyncer extends Syncer {
  async start() {
    await this.syncHistorical()
    await this.syncLatest()
  }

  async syncHistorical() {
    if (await CategoryMarketCap.exists()) {
      return
    }

    const date = utcDate()
    const marketCaps = await Category.getMarketCaps()
    const categories = []
    const categoryMarketCaps = []

    for (let i = 0; i < marketCaps.length; i += 1) {
      const category = marketCaps[i]

      categories.push([
        category.id,
        JSON.stringify({ amount: category.market_cap_amount })
      ])

      categoryMarketCaps.push({
        date,
        category_id: category.id,
        market_cap: category.market_cap_amount,
      })
    }

    await Category.updateMarketCaps(categories)
    await this.upsertCategoryMarketCaps(categoryMarketCaps)
  }

  async syncLatest() {
    this.cron('1h', this.syncDailyStats)
    this.cron('4h', this.syncWeeklyStats)
    this.cron('1d', this.syncMonthlyStats)
  }

  async syncDailyStats({ dateTo }) {
    const categories = await Category.getMarketCaps()
    const mapped = await this.mapMarketCaps()

    const categoryMarketCaps = []
    const categoryUpdates = []

    for (let i = 0; i < categories.length; i += 1) {
      const category = categories[i]
      const prevMCap = mapped[category.id] || {}
      const marketCapAmount = category.market_cap_amount

      categoryMarketCaps.push({
        date: dateTo,
        category_id: category.id,
        market_cap: marketCapAmount,
      })

      const marketCap = {
        amount: marketCapAmount,
        change_24h: percentageChange(prevMCap['24h'], marketCapAmount),
        change_1w: percentageChange(prevMCap['1w'], marketCapAmount),
        change_1m: percentageChange(prevMCap['1m'], marketCapAmount),
      }

      categoryUpdates.push([
        category.id,
        JSON.stringify(marketCap)
      ])
    }

    await Category.updateMarketCaps(categoryUpdates)
    await this.upsertCategoryMarketCaps(categoryMarketCaps)
  }

  async syncWeeklyStats({ dateFrom, dateTo }) {
    await CategoryMarketCap.deleteExpired(dateFrom, dateTo)
  }

  async syncMonthlyStats({ dateFrom, dateTo }) {
    await CategoryMarketCap.deleteExpired(dateFrom, dateTo)
  }

  async mapMarketCaps() {
    const mapped = {}
    const mapBy = (items, key) => {
      for (let i = 0; i < items.length; i += 1) {
        const item = items[i]
        const map = mapped[item.category_id] || (mapped[item.category_id] = {})

        map[key] = item.market_cap
      }
    }

    const history24h = await CategoryMarketCap.findAll({ where: { date: utcDate({ day: -1 }, 'yyyy-MM-dd') } })
    const history1w = await CategoryMarketCap.findAll({ where: { date: utcDate({ days: -7 }) } })
    const history1m = await CategoryMarketCap.findAll({ where: { date: utcDate({ days: -30 }) } })

    mapBy(history24h, '24h')
    mapBy(history1w, '1w')
    mapBy(history1m, '1m')

    return mapped
  }

  upsertCategoryMarketCaps(items) {
    return CategoryMarketCap.bulkCreate(items, { ignoreDuplicates: true })
      .then(records => {
        console.log(`Inserted ${records.length} category market caps`)
      })
      .catch(err => {
        console.error('Error inserting category market caps', err.message)
      })
  }

  syncParams(period) {
    switch (period) {
      case '30m':
        return {
          dateFrom: utcDate({ days: -1, minutes: -30 }),
          dateTo: utcDate({ days: -1 }),
        }
      case '4h':
        return {
          dateFrom: utcDate({ days: -7, hours: -4 }),
          dateTo: utcDate({ days: -7 }),
        }
      case '1d':
        return {
          dateFrom: utcDate({ days: -31 }, 'yyyy-MM-dd'),
          dateTo: utcDate({ days: -30 }, 'yyyy-MM-dd')
        }
      default:
        return {}
    }
  }

}

module.exports = CategoryMarketCapSyncer
