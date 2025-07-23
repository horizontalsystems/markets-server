const { nullOrString, nullOrInteger, valueInCurrency } = require('../../utils')
const { mapChartPoints, mapChains } = require('./vaults.heper')

exports.serializeIndex = (items, currencyRate) => {
  return items.map((item, i) => {
    return {
      rank: i + 1,
      address: item.address,
      name: item.name,
      apy: {
        '1d': nullOrString(item.apy['1d']),
        '7d': nullOrString(item.apy['7d']),
        '30d': nullOrString(item.apy['30d'])
      },
      tvl: valueInCurrency(item.tvl, currencyRate),
      chain: mapChains(item.chain),
      asset_symbol: item.asset_symbol,
      asset_logo: item.asset_logo,
      protocol_name: item.protocol_name,
      protocol_logo: item.protocol_logo,
      holders: nullOrInteger(item.holders),
      url: item.url
    }
  })
}

exports.serializeShow = (item, currencyRate, rangeInterval = '3m') => {
  let points = []
  if (rangeInterval === '1d' || rangeInterval === '1w' || rangeInterval === '2w') {
    points = mapChartPoints(item.apy_history_hourly, rangeInterval)
  } else {
    points = mapChartPoints(item.apy_history, rangeInterval)
  }

  return {
    address: item.address,
    name: item.name,
    apy: {
      '1d': nullOrString(item.apy['1d']),
      '7d': nullOrString(item.apy['7d']),
      '30d': nullOrString(item.apy['30d'])
    },
    tvl: valueInCurrency(item.tvl, currencyRate),
    chain: mapChains(item.chain),
    asset_symbol: item.asset_symbol,
    protocol_name: item.protocol_name,
    protocol_logo: item.protocol_logo,
    holders: nullOrInteger(item.holders),
    url: item.url,
    apy_chart: points
  }
}
