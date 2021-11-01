const { nullOrString, valueInCurrency, floatToString } = require('../../utils')

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
      return Math.round(new Date(coin.last_updated).getTime() / 1000)
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

exports.serializeShow = (coin, language, currencyRate) => {
  const market = coin.market_data || {}
  const description = coin.description || {}

  return {
    uid: coin.uid,
    name: coin.name,
    code: coin.code,
    genesis_date: coin.genesis_date,
    description: description[language],
    links: coin.links,
    price: valueInCurrency(coin.price, currencyRate),
    market_data: {
      total_supply: nullOrString(market.total_supply),
      total_volume: valueInCurrency(market.total_volume, currencyRate),
      market_cap: valueInCurrency(market.market_cap, currencyRate),
      market_cap_rank: market.market_cap_rank,
      circulating_supply: nullOrString(market.circulating_supply),
      fully_diluted_valuation: valueInCurrency(market.fully_diluted_valuation, currencyRate),
      total_value_locked: valueInCurrency(market.total_value_locked, currencyRate)
    },
    performance: coin.performance,
    category_uids: coin.Categories.map(category => category.uid)
  }
}

exports.serializeDetails = (coin, currencyRate) => {
  return {
    uid: coin.uid,
    security: coin.security,
    tvl: nullOrString(coin.tvl),
    tvl_rank: parseInt(coin.tvl_rank, 10),
    tvl_ratio: nullOrString(parseFloat(coin.market_cap) / parseFloat(coin.tvl)),
    investor_data: {
      funds_invested: valueInCurrency(coin.funds_invested, currencyRate),
      treasuries: valueInCurrency(coin.treasuries, currencyRate)
    }
  }
}

exports.serializeTreasuries = (treasuries, currencyRate) => {
  return treasuries.map(item => ({
    type: item.type,
    amount: item.amount,
    amountInCurrency: valueInCurrency(item.amount_usd, currencyRate),
    country: item.country
  }))
}

exports.serializeFundsInvested = (treasuries, currencyRate) => {
  return treasuries.map(item => ({
    date: item.date,
    round: item.round,
    amount: valueInCurrency(item.amount, currencyRate),
    funds: item.funds
  }))
}

exports.serializeCoinHolders = (coinHolders) => {
  return coinHolders.map((item) => ({
    address: item.address,
    share: floatToString(item.share)
  }))
}
