const { nullOrInteger, utcDate, valueInCurrency } = require('../../utils')

const intervalToDate = function intervalToDate(interval) {
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

const mapChartPoints = (apyHistory, tvlHistory, rangeInterval, currencyRate) => {
  if (!apyHistory) return []

  const from = parseInt(intervalToDate(rangeInterval), 10)
  const keys = Object.keys(apyHistory)
  const chart = []

  for (let i = 0; i < keys.length; i += 1) {
    const timestamp = keys[i]
    const apy = apyHistory[timestamp]
    const tvl = tvlHistory[timestamp]

    if (!apy) continue
    if (timestamp >= from) {
      chart.push({
        timestamp: nullOrInteger(timestamp),
        apy: valueInCurrency(apy, currencyRate),
        tvl: valueInCurrency(tvl, currencyRate),
      })
    }
  }

  return chart
}

const mapChains = (chain) => {
  switch (chain) {
    case 'arbitrum':
      return 'arbitrum-one'
    case 'berachain':
      return 'berachain-bera'
    case 'bsc':
      return 'binance-smart-chain'
    case 'optimism':
      return 'optimistic-ethereum'
    case 'polygon':
      return 'polygon-pos'
    case 'worldchain':
      return 'world-chain'

    case 'base':
    case 'celo':
    case 'ethereum':
    case 'gnosis':
    case 'swellchain':
    case 'unichain':
    default:
      return chain
  }
}

module.exports = {
  intervalToDate,
  mapChartPoints,
  mapChains
}
