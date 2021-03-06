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
    return items.map(item => {
      return {
        uid: item.uid,
        market_cap: valueInCurrency(item.mcap, currencyRate)
      }
    })
  },

  serializeChart: (items, currencyRate) => {
    return items.map(item => {
      return {
        date: item.date,
        market_cap: valueInCurrency(item.market_cap, currencyRate)
      }
    })
  },

}
