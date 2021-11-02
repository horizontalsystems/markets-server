const { nullOrString, valueInCurrency } = require('../../utils')

exports.serializeList = (coins, currencyRate) => {
  return coins.map(item => {
    const data = item.defi_data || {}
    return {
      uid: item.uid,
      chains: data.chains,
      tvl: valueInCurrency(data.tvl, currencyRate),
      tvl_rank: parseInt(data.tvl_rank, 10),
      tvl_change_1d: nullOrString(data.tvl_change_1d),
      tvl_change_7d: nullOrString(data.tvl_change_7d),
      tvl_change_30d: nullOrString(data.tvl_change_30d)
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
