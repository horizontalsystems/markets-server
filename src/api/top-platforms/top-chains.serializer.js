const { nullOrString, valueInCurrency } = require('../../utils')

module.exports = {

  serialize: (items, currencyRate) => {
    return items.map((item, index) => {
      const stats = item.stats || {}

      return {
        uid: item.uid,
        name: item.name,
        rank: index + 1,
        protocols: parseInt(stats.protocols, 10),
        market_cap: valueInCurrency(stats.market_cap, currencyRate),
        stats: {
          rank_1d: nullOrString(stats.rank_1d),
          rank_1w: nullOrString(stats.rank_1w),
          rank_1m: nullOrString(stats.rank_1m),
          rank_3m: nullOrString(stats.rank_3m),
          change_1d: nullOrString(stats.change_1d),
          change_1w: nullOrString(stats.change_1w),
          change_1m: nullOrString(stats.change_1m),
          change_3m: nullOrString(stats.change_3m)
        },
      }
    })
  },

  serializePlatforms: (items, currencyRate) => {
    return items.map((item, index) => {
      return {
        uid: item.uid,
        price: valueInCurrency(item.price, currencyRate),
        price_change_24h: nullOrString(item.price_change_24h),
        price_change_7d: nullOrString(item.price_change['7d']),
        price_change_30d: nullOrString(item.price_change['30d']),
        price_change_90d: nullOrString(item.price_change['90d']),
        market_cap: valueInCurrency(item.mcap, currencyRate),
        market_cap_rank: index + 1,
        total_volume: valueInCurrency(item.total_volume, currencyRate)
      }
    })
  },

  serializeChart: (items, currencyRate) => {
    return items.map(item => {
      return {
        timestamp: item.timestamp,
        market_cap: valueInCurrency(item.market_cap, currencyRate)
      }
    })
  },

  serializeFirstPoints: (data = {}) => ({
    timestamp: data.timestamp
  })
}
