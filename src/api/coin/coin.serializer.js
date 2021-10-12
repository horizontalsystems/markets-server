const { nullOrString, valueInCurrency } = require('../../utils')

function mapPlatforms(platforms) {
  return platforms.map(platform => ({
    type: platform.type,
    decimals: platform.decimals,
    address: platform.address,
    symbol: platform.symbol
  }))
}

exports.serializeMarkets = (coins, currencyPrice) => {
  return coins.map(coin => {
    const market = coin.market_data || {}
    const priceChange = coin.price_change || {}

    return ({
      uid: coin.uid,
      price: valueInCurrency(coin.price, currencyPrice),
      price_change_24h: nullOrString(priceChange['24h']),
      market_cap: valueInCurrency(market.market_cap, currencyPrice),
      total_volume: valueInCurrency(market.total_volume, currencyPrice),
    })
  })
}

exports.serializeAll = coins => {
  return coins.map(coin => {
    const market = coin.market_data || {}

    return ({
      uid: coin.uid,
      name: coin.name,
      code: coin.code,
      coingecko_id: coin.coingecko_id,
      market_cap_rank: market.market_cap_rank,
      platforms: mapPlatforms(coin.Platforms),
    })
  })
}

exports.serializePrices = (coins, currencyPrice) => {
  return coins.reduce((memo, coin) => {
    memo[coin.uid] = {
      price: valueInCurrency(coin.price, currencyPrice),
      price_change_24h: nullOrString(coin.price_change_24h),
      last_updated: coin.last_updated,
    }
    return memo
  }, {})
}

exports.serializeInfo = (coin, language, currencyPrice) => {
  const market = coin.market_data || {}
  const priceChange = coin.price_change || {}
  const descriptions = coin.description || {}

  return {
    uid: coin.uid,
    name: coin.name,
    code: coin.code,
    coingecko_id: coin.coingecko_id,
    genesis_date: coin.genesis_date,
    description: descriptions[language],
    links: coin.links,
    price: valueInCurrency(coin.price, currencyPrice),
    price_change: {
      '1y': nullOrString(priceChange['1y']),
      '7d': nullOrString(priceChange['7d']),
      '24h': nullOrString(priceChange['24h']),
      '30d': nullOrString(priceChange['30d']),
      ath: nullOrString(priceChange.ath),
      atl: nullOrString(priceChange.atl),
      low_24h: nullOrString(priceChange.low_24h),
      ath_date: nullOrString(priceChange.ath_date),
      atl_date: nullOrString(priceChange.atl_date),
      high_24h: nullOrString(priceChange.high_24h),
      ath_change_percentage: nullOrString(priceChange.ath_change_percentage),
      atl_change_percentage: nullOrString(priceChange.atl_change_percentage),
    },
    market_data: {
      max_supply: nullOrString(market.max_supply),
      total_supply: nullOrString(market.total_supply),
      total_volume: valueInCurrency(market.total_volume, currencyPrice),
      market_cap: valueInCurrency(market.market_cap, currencyPrice),
      market_cap_rank: market.market_cap_rank,
      circulating_supply: nullOrString(market.circulating_supply),
      fully_diluted_valuation: nullOrString(market.fully_diluted_valuation)
    },
    security: coin.security,
    performance: coin.performance,
    platforms: mapPlatforms(coin.Platforms),
    category_ids: coin.Categories.map(category => category.uid)
  }
}
