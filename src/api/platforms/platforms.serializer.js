const { nullOrString } = require('../../utils')

module.exports = {

  serialize: items => {
    return items.map((item, index) => {
      const stats = item.stats || {}

      return {
        uid: item.uid,
        name: item.name,
        rank: index + 1,
        protocols: parseInt(stats.protocols, 10),
        market_cap: nullOrString(stats.market_cap),
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

  serializePlatforms: items => {
    return items.map(item => {
      return {
        uid: item.uid,
        market_cap: nullOrString(item.mcap)
      }
    })
  },

  serializeChart: items => {
    return items.map(item => {
      return {
        date: item.date,
        market_cap: nullOrString(item.market_cap)
      }
    })
  },

}
