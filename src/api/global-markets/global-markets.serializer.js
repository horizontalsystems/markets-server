const { valueInCurrency } = require('../../utils')

exports.serializeList = (coins, currencyRate) => {
  return coins.map(item => {
    return {
      date: item.date,
      market_cap: valueInCurrency(item.market_cap, currencyRate),
      defi_market_cap: valueInCurrency(item.defi_market_cap, currencyRate),
      volume: valueInCurrency(item.volume, currencyRate),
      btc_dominance: item.btc_dominance,
      tvl: valueInCurrency(item.tvl, currencyRate),
    }
  })
}

exports.serializeTvls = (tvls, currencyRate) => {
  return tvls.map(item => {
    return {
      date: item.date,
      tvl: valueInCurrency(item.tvl || '0', currencyRate),
    }
  })
}
