const { nullOrString } = require('../../utils')

exports.serializeIndex = (items) => {
  return items.map(item => {
    return {
      uid: item.uid,
      name: item.name,
      symbol: item.symbol,
      market_price: nullOrString(item.market_price),
      price_change: {
        '1y': nullOrString(item.price_change['1y']),
        '7d': nullOrString(item.price_change['7d']),
        '30d': nullOrString(item.price_change['30d']),
        '90d': nullOrString(item.price_change['90d']),
        '200d': nullOrString(item.price_change['200d'])
      }
    }
  })
}
