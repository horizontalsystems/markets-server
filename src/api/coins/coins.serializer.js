const { nullOrString, valueInCurrency } = require('../../utils')

function mapPlatforms(platforms) {
  return platforms.map(platform => ({
    type: platform.type,
    decimals: platform.decimals,
    address: platform.address,
    symbol: platform.symbol
  }))
}

function mapCoinAttribute(coin, field, currencyRate) {
  switch (field) {
    case 'price':
      return valueInCurrency(coin.price, currencyRate)
    case 'price_change_24h':
      return nullOrString(coin.price_change['24h'])
    case 'price_change_7d':
      return nullOrString(coin.price_change['7d'])
    case 'price_change_30d':
      return nullOrString(coin.price_change['30d'])
    case 'ath':
      return nullOrString(coin.price_change.ath)
    case 'atl':
      return nullOrString(coin.price_change.atl)
    case 'market_cap':
      return valueInCurrency(coin.market_data.market_cap, currencyRate)
    case 'market_cap_rank':
      return coin.market_data.market_cap_rank
    case 'total_volume':
      return valueInCurrency(coin.market_data.total_volume, currencyRate)
    case 'platforms':
      return mapPlatforms(coin.Platforms)

    default:
      return coin[field]
  }
}

exports.serializeList = (coins, fields, currencyRate) => {
  return coins.map(item => {
    const coin = {
      uid: item.uid
    }

    fields.forEach(attribute => {
      coin[attribute] = mapCoinAttribute(item, attribute, currencyRate)
    })

    return coin
  })
}

exports.serializeShow = (coin, language, currencyPrice) => {
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
      ath: valueInCurrency(priceChange.ath, currencyPrice),
      atl: valueInCurrency(priceChange.atl, currencyPrice),
      low_24h: valueInCurrency(priceChange.low_24h, currencyPrice),
      ath_date: nullOrString(priceChange.ath_date),
      atl_date: nullOrString(priceChange.atl_date),
      high_24h: valueInCurrency(priceChange.high_24h, currencyPrice),
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
      fully_diluted_valuation: valueInCurrency(market.fully_diluted_valuation, currencyPrice)
    },
    security: coin.security,
    performance: coin.performance,
    platforms: mapPlatforms(coin.Platforms),
    category_ids: coin.Categories.map(category => category.uid)
  }
}
