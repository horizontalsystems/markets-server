const { nullOrString } = require('../../utils')

module.exports = {

  serialize: categories => {
    return categories.map(category => {
      const marketCap = category.market_cap || {}

      return {
        uid: category.uid,
        name: category.name,
        order: category.order,
        description: category.description || {},
        market_cap: nullOrString(marketCap.amount),
        change_24h: nullOrString(marketCap.change_24h),
        change_1w: nullOrString(marketCap.change_1w),
        change_1m: nullOrString(marketCap.change_1m)
      }
    })
  }

}
