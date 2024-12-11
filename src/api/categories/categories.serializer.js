const { nullOrString, valueInCurrency } = require('../../utils')

module.exports = {

  serialize: (categories, currencyRate) => {
    return categories.map(category => {
      const marketCap = category.market_cap || {}

      return {
        uid: category.uid,
        name: category.name,
        order: category.order,
        description: category.description || {},
        market_cap: valueInCurrency(marketCap.amount, currencyRate),
        change_24h: nullOrString(marketCap.change_24h),
        change_1w: nullOrString(marketCap.change_1w),
        change_1m: nullOrString(marketCap.change_1m)
      }
    })
  },

  serializeTopCoins: (categories, currencyRate) => {
    return categories.map(category => {
      const marketCap = category.market_cap || {}

      return {
        uid: category.uid,
        name: category.name,
        order: category.order,
        description: category.description || {},
        market_cap: valueInCurrency(marketCap.amount, currencyRate),
        change_24h: nullOrString(marketCap.change_24h),
        change_1w: nullOrString(marketCap.change_1w),
        change_1m: nullOrString(marketCap.change_1m),
        top_coins: category.top_coins
      }
    })
  },

  serializeMarketCap: (data, currencyRate) => {
    return data.map(item => {
      return {
        timestamp: item.timestamp,
        market_cap: valueInCurrency(item.market_cap, currencyRate)
      }
    })
  }

}
