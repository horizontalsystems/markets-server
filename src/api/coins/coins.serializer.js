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
  const priceChange = coin.price_change || {}
  const marketData = coin.market_data || {}

  switch (field) {
    case 'name':
    case 'code':
    case 'coingecko_id':
      return coin[field]

    case 'price':
      return valueInCurrency(coin.price, currencyRate)
    case 'price_change_24h':
      return nullOrString(priceChange['24h'])
    case 'price_change_7d':
      return nullOrString(priceChange['7d'])
    case 'price_change_14d':
      return nullOrString(priceChange['14d'])
    case 'price_change_30d':
      return nullOrString(priceChange['30d'])
    case 'price_change_200d':
      return nullOrString(priceChange['200d'])
    case 'price_change_1y':
      return nullOrString(priceChange['1y'])
    case 'ath_percentage':
      return nullOrString(priceChange.ath_change_percentage)
    case 'atl_percentage':
      return nullOrString(priceChange.atl_change_percentage)
    case 'market_cap':
      return valueInCurrency(marketData.market_cap, currencyRate)
    case 'market_cap_rank':
      return marketData.market_cap_rank
    case 'total_volume':
      return valueInCurrency(marketData.total_volume, currencyRate)
    case 'last_updated':
      return new Date(coin.last_updated).getTime()
    case 'platforms':
      return mapPlatforms(coin.Platforms)

    default:
      return null
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

  return {
    uid: coin.uid,
    name: coin.name,
    code: coin.code,
    genesis_date: coin.genesis_date,
    description: coin.description[language],
    links: coin.links,
    price: valueInCurrency(coin.price, currencyPrice),
    market_data: {
      total_supply: nullOrString(market.total_supply),
      total_volume: valueInCurrency(market.total_volume, currencyPrice),
      market_cap: valueInCurrency(market.market_cap, currencyPrice),
      market_cap_rank: market.market_cap_rank,
      circulating_supply: nullOrString(market.circulating_supply),
      fully_diluted_valuation: valueInCurrency(market.fully_diluted_valuation, currencyPrice),
      total_value_locked: valueInCurrency(market.total_value_locked, currencyPrice)
    },
    performance: coin.performance,
    categories: coin.Categories.map(category => category.uid)
  }
}

exports.serializeDetails = (coin, currencyPrice) => {
  console.log(coin)

  return {
    uid: coin.uid,
    name: coin.name,
    code: coin.code,
    links: coin.links,
    price: valueInCurrency(coin.price, currencyPrice),
    security: coin.security,
    funds_invested: coin.FundsInvesteds
  }
}
