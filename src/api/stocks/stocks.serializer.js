const { nullOrString } = require('../../utils')

exports.serializeIndex = (items) => {
  return items.map(item => {
    return {
      uid: item.uid,
      name: item.name,
      symbol: item.symbol,
      market_price: nullOrString(item.market_price),
      price_change: {
        '1d': nullOrString(item.price_change['1d']),
        '7d': nullOrString(item.price_change['7d']),
        '14d': nullOrString(item.price_change['14d']),
        '30d': nullOrString(item.price_change['30d']),
        '90d': nullOrString(item.price_change['90d']),
        '200d': nullOrString(item.price_change['200d']),
        '1y': nullOrString(item.price_change['1y']),
        '2y': nullOrString(item.price_change['2y']),
        '3y': nullOrString(item.price_change['3y']),
        '4y': nullOrString(item.price_change['4y']),
        '5y': nullOrString(item.price_change['5y']),
      }
    }
  })
}
