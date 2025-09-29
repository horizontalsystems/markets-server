const { nullOrString, valueInCurrency } = require('../../utils')
const customDappList = require('./custom-dapp-list.json')

exports.serializeIndex = (protocols, currencyRate) => {
  return protocols.map(item => {
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
      tvl_change_1w: nullOrString(change.change_1w),
      tvl_change_2w: nullOrString(change.change_2w),
      tvl_change_1m: nullOrString(change.change_1m),
      tvl_change_3m: nullOrString(change.change_3m),
      tvl_change_6m: nullOrString(change.change_6m),
      tvl_change_1y: nullOrString(change.change_1y),
      chains,
      chain_tvls: chains.reduce((res, key) => ({ ...res, [key]: nullOrString(chainTvls[key]) }), {})
    }
  })
}

exports.serializeList = (protocols, currencyRate) => {
  return protocols.map(item => {
    const change = item.tvl_change || {}
    const chains = item.chains || []
    const chainTvls = item.chain_tvls || {}

    return {
      uid: item.defillama_id,
      coin_uid: item.uid,
      name: item.coin_name || item.name,
      logo: item.logo,
      tvl: valueInCurrency(item.tvl, currencyRate),
      tvl_rank: parseInt(item.tvl_rank, 10),
      tvl_change_1d: nullOrString(change.change_1d),
      tvl_change_1w: nullOrString(change.change_1w),
      tvl_change_2w: nullOrString(change.change_2w),
      tvl_change_1m: nullOrString(change.change_1m),
      tvl_change_3m: nullOrString(change.change_3m),
      tvl_change_6m: nullOrString(change.change_6m),
      tvl_change_1y: nullOrString(change.change_1y),
      chains,
      chain_tvls: chains.reduce((res, key) => ({ ...res, [key]: nullOrString(chainTvls[key]) }), {})
    }
  })
}

exports.serializeDapps = protocols => {
  const items = []

  for (let i = 0; i < protocols.length; i += 1) {
    const protocol = protocols[i]

    if (!protocol.url || !protocol.url.length || protocol.tvl_change.change_1w === null) {
      continue
    }

    try {
      const url = new URL(protocol.url)
      const host = url.host.replace(/^www\./, '')

      items.push({
        name: protocol.name,
        url: host
      })
    } catch (e) {
      console.log(`${protocol.defillama_id}`, e.message)
    }
  }

  return [...items, ...customDappList]
}

exports.serializeTvls = (tvls, currencyRate) => {
  return tvls.map(item => {
    return {
      date: item.date,
      tvl: valueInCurrency(item.tvl, currencyRate)
    }
  })
}
