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
          change_1d: nullOrString(stats.change_1d),
          change_1m: nullOrString(stats.change_1m),
          change_1w: nullOrString(stats.change_1w)
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

}
