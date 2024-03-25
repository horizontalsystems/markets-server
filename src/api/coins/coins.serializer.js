const { nullOrString, valueInCurrency } = require('../../utils')

function mapOldTypes(type, chain) {
  if (type === 'erc20' || type === 'bep20' || type === 'bep2') {
    return type
  }

  switch (chain) {
    case 'bitcoin':
    case 'bitcoin-cash':
    case 'litecoin':
    case 'dash':
    case 'zcash':
      return chain
    case 'ethereum':
      return type === 'eip20' ? 'erc20' : chain
    case 'binance-smart-chain':
      return type === 'eip20' ? 'bep20' : chain
    case 'binancecoin':
      return 'bep2'
    case 'optimistic-ethereum':
      return type === 'eip20' ? 'optimistic-ethereum' : 'ethereum-optimism'
    case 'arbitrum-one':
      return type === 'eip20' ? 'arbitrum-one' : 'ethereum-arbitrum-one'
    case 'polygon-pos':
      return type === 'eip20' ? 'polygon-pos' : 'polygon'
    default:
      return type
  }
}

function mapPlatforms(platforms, legacy) {
  const legacyPlatforms = ['erc20', 'bep20', 'bep2', 'bitcoin', 'bitcoin-cash', 'litecoin', 'dash', 'zcash', 'ethereum', 'binance-smart-chain']

  return platforms.map(platform => {
    let { decimals } = platform

    const type = mapOldTypes(platform.type, platform.chain_uid)

    // @deprecated
    if (legacy && !legacyPlatforms.includes(type)) {
      decimals = null
    }

    return {
      type,
      decimals,
      address: platform.address,
      symbol: platform.symbol
    }
  })
}

function mapCoinAttribute(coin, field, currencyRate) {
  const priceChange = coin.price_change || {}
  const marketData = coin.market_data || {}

  switch (field) {
    case 'uid':
    case 'name':
    case 'code':
    case 'coingecko_id':
      return coin[field]

    case 'price':
      return valueInCurrency(coin.price, currencyRate)
    case 'price_change_24h':
      return nullOrString(coin.price_change_24h || priceChange['24h'])
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
      return mapPlatforms(coin.Platforms, true)
    case 'all_platforms':
      return mapPlatforms(coin.Platforms)

    default:
      return undefined
  }
}

exports.serializeCoins = (coins, fields, currencyRate) => {
  if (!fields.length) {
    return []
  }

  return coins.map(item => {
    const coin = {
      uid: item.uid
    }

    for (let i = 0; i < fields.length; i += 1) {
      const attribute = fields[i]
      coin[attribute] = mapCoinAttribute(item, attribute, currencyRate)
    }

    return coin
  })
}

exports.serializeFilter = (coins, currencyRate, whitelisted) => {
  const fields = [
    'price',
    'market_cap',
    'market_cap_rank',
    'total_volume',
    'price_change_24h',
    'price_change_7d',
    'price_change_14d',
    'price_change_30d',
    'price_change_200d',
    'price_change_1y',
    'ath_percentage',
    'atl_percentage'
  ]

  const isListedOnTopExchanges = tickers => {
    let isListed = false
    for (let i = 0; i < tickers.length; i += 1) {
      const exchange = tickers[i]
      if (whitelisted[exchange.market_uid]) {
        isListed = true
        break
      }
    }

    return isListed
  }

  return coins.map(item => {
    const { result } = item.CoinIndicators[0] || {}
    const { rank } = item.CoinStats[0] || { rank: {} }
    const coin = {
      uid: item.uid,
      listed_on_top_exchanges: isListedOnTopExchanges(item.CoinMarkets),
      solid_cex: rank.cex_volume_week_rating === 'excellent',
      solid_dex: rank.dex_volume_week_rating === 'excellent',
      good_distribution: rank.holders_rating === 'excellent',
      indicators_result: result
    }

    for (let i = 0; i < fields.length; i += 1) {
      const attribute = fields[i]
      coin[attribute] = mapCoinAttribute(item, attribute, currencyRate)
    }

    return coin
  })
}

exports.serializeList = coins => {
  return coins.map(coin => ({
    uid: coin.uid,
    name: coin.name,
    code: coin.code,
    coingecko_id: coin.coingecko_id,
    market_cap_rank: coin.market_cap_rank
  }))
}

exports.serializeShow = (coin, language, currencyRate) => {
  const market = coin.market_data || {}
  const categories = coin.Categories || []
  const description = coin.description || {}

  const categoryUids = []
  const categoryMap = []
  for (let i = 0; i < categories.length; i += 1) {
    const category = categories[i]

    categoryUids.push(category.uid)
    categoryMap.push({
      uid: category.uid,
      name: category.name,
      description: category.description
    })
  }

  return {
    uid: coin.uid,
    name: coin.name,
    code: coin.code,
    genesis_date: coin.genesis_date,
    description: description[language] || description.en,
    links: coin.links || {},
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
    categories: categoryMap,
    category_uids: categoryUids, // @deprecated
    platforms: mapPlatforms(coin.Platforms)
  }
}

exports.serializeDetails = (coin, currencyRate) => {
  return {
    uid: coin.uid,
    security: coin.security,
    tvl: nullOrString(coin.tvl),
    tvl_rank: parseInt(coin.tvl_rank, 10),
    tvl_ratio: nullOrString(parseFloat(coin.market_cap) / parseFloat(coin.tvl)),
    reports_count: parseInt(coin.reports, 10),
    investor_data: {
      funds_invested: nullOrString(coin.funds_invested),
      treasuries: valueInCurrency(coin.treasuries, currencyRate)
    }
  }
}

exports.serializeTwitter = coin => ({
  twitter: nullOrString(coin.twitter)
})

exports.serializeFirstCoinPrice = (price = {}) => ({
  timestamp: price.timestamp
})

exports.serializeMovers = (data, currencyRate) => {
  const mapper = items => items.map(item => ({
    uid: item.uid,
    price: valueInCurrency(item.price, currencyRate),
    price_change_24h: nullOrString(item.price_change_24h),
    market_cap_rank: item.market_cap_rank
  }))

  return {
    gainers_100: mapper(data.gainers_100),
    losers_100: mapper(data.losers_100),
    gainers_200: mapper(data.gainers_200),
    losers_200: mapper(data.losers_200),
    gainers_300: mapper(data.gainers_300),
    losers_300: mapper(data.losers_300)
  }
}

exports.serializeGainers = (data, currencyRate) => {
  const mapper = items => items.map(item => ({
    uid: item.uid,
    name: item.name,
    code: item.code,
    market_cap_rank: item.market_cap_rank,
    price: valueInCurrency(item.price, currencyRate),
    price_change_24h: nullOrString(item.price_change_24h)
  }))

  return mapper(data)
}

exports.serializePriceChart = (priceChart, currencyRate) => {
  return priceChart.map(item => ({
    timestamp: item.timestamp,
    price: valueInCurrency(item.price, currencyRate),
    volume: valueInCurrency(item.volume, currencyRate)
  }))
}

exports.serializePriceHistory = (priceData, currencyRate) => ({
  timestamp: priceData.timestamp,
  price: valueInCurrency(priceData.price, currencyRate)
})
