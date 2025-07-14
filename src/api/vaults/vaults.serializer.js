const { nullOrString, nullOrInteger, utcDate } = require('../../utils')

exports.serializeIndex = (items) => {
  return items.map(item => {
    return {
      address: item.address,
      name: item.name,
      apy: {
        '1d': nullOrString(item.apy['1d']),
        '7d': nullOrString(item.apy['7d']),
        '30d': nullOrString(item.apy['30d'])
      },
      tvl: nullOrString(item.tvl),
      chain: item.chain,
      asset_symbol: item.asset_symbol,
      asset_logo: item.asset_logo,
      protocol_name: item.protocol_name,
      protocol_logo: item.protocol_logo,
      holders: nullOrInteger(item.holders),
      url: item.url
    }
  })
}

function intervalToDate(interval) {
  switch (interval) {
    case '1d':
      return utcDate({ days: -2 }, null, true)
    case '1w':
      return utcDate({ days: -7 }, null, true)
    case '2w':
      return utcDate({ days: -14 }, null, true)
    case '1m':
      return utcDate({ days: -30 }, null, true)
    case '3m':
      return utcDate({ days: -90 }, null, true)
    case '6m':
    default:
      return utcDate({ days: -180 }, null, true)
  }
}

function mapChartPoints(history, rangeInterval) {
  if (!history) {
    return []
  }
  const from = parseInt(intervalToDate(rangeInterval), 10)
  const entries = Object.entries(history)
  const chart = []

  for (let i = 0; i < entries.length; i += 1) {
    const [timestamp, apy] = entries[i]

    if (timestamp >= from) {
      chart.push({ timestamp, apy: nullOrString(apy) })
    }
  }

  return chart
}

exports.serializeShow = (item, rangeInterval = '3m') => {
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
    tvl: nullOrString(item.tvl),
    chain: item.chain,
    asset_symbol: item.asset_symbol,
    protocol_name: item.protocol_name,
    protocol_logo: item.protocol_logo,
    holders: nullOrInteger(item.holders),
    url: item.url,
    apy_chart: points
  }
}
