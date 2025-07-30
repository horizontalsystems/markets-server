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
  let chart = []
  if (rangeInterval === '1d' || rangeInterval === '1w' || rangeInterval === '2w') {
    chart = mapChartPoints(item.apy_history_hourly, item.tvl_history_hourly, rangeInterval, currencyRate)
  } else {
    chart = mapChartPoints(item.apy_history, item.tvl_history, rangeInterval, currencyRate)
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
    chart
  }
}
