const { nullOrString, valueInCurrency } = require('../../utils')

exports.serializeList = (coins, currencyRate) => {
  return coins.map(item => {
    const change = item.tvl_change || {}
    const chains = item.chains || []
    const chainTvls = item.chain_tvls || {}

    return {
      uid: item.uid,
      name: item.coin_name || item.name,
      logo: item.logo,
      tvl: valueInCurrency(item.tvl, currencyRate),
      tvl_rank: parseInt(item.tvl_rank, 10),
      tvl_change_1d: nullOrString(change.change_1d),
      tvl_change_7d: nullOrString(change.change_7d),
      tvl_change_30d: nullOrString(change.change_30d),
      chains,
      chain_tvls: chains.reduce((res, key) => ({ ...res, [key]: nullOrString(chainTvls[key]) }), {})
    }
  })
}

exports.serializeTvls = (tvls, currencyRate) => {
  return tvls.map(item => {
    return {
      date: item.date,
      tvl: valueInCurrency(item.tvl, currencyRate)
    }
  })
}
