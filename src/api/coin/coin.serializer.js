function mapPlatforms(platforms) {
  return platforms.map(platform => ({
    type: platform.type,
    decimals: platform.decimals,
    address: platform.address,
    symbol: platform.symbol
  }))
}

exports.serializeCoins = coins => {
  return coins.map(coin => ({
    uid: coin.uid,
    name: coin.name,
    code: coin.code,
    coingecko_id: coin.coingecko_id,
    price: coin.price,
    price_change_24h: coin.price_change['24h'],
    market_cap: coin.market_data.market_cap,
    market_cap_rank: coin.market_data.market_cap_rank,
    total_volume: coin.market_data.total_volume,
  }))
}

exports.serializeAllList = coins => {
  return coins.map(coin => ({
    uid: coin.uid,
    name: coin.name,
    code: coin.code,
    coingecko_id: coin.coingecko_id,
    market_cap_rank: coin.market_data.market_cap_rank,
    platforms: mapPlatforms(coin.Platforms),
  }))
}

exports.serializePrices = coins => {
  return coins.reduce((memo, coin) => {
    memo[coin.uid] = {
      price: coin.price,
      price_change: coin.price_change['24h'],
      last_updated: coin.last_updated,
    }
    return memo
  }, {})
}

exports.serializeInfo = ({ Categories, Platforms, ...coin }) => {
  return {
    ...coin,
    platforms: mapPlatforms(Platforms),
    category_ids: Categories.map(category => category.uid)
  }
}
