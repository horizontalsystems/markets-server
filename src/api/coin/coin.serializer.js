exports.serializeSearchResult = coins => {
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
    platforms: platforms(coin.Platforms),
  }))
}

exports.serializePrices = coins => {
  return coins.reduce((memo, coin) => {
    memo[coin.uid] = coin.price
    return memo
  }, {})
}

exports.serializeInfo = ({ Categories, Platforms, ...coin }) => {
  return {
    ...coin,
    platforms: platforms(Platforms),
    category_ids: Categories.map(category => category.uid)
  }
}

function platforms(platforms) {
  return platforms.map(platform => ({
    type: platform.type,
    decimal: platform.decimal,
    address: platform.address,
    symbol: platform.symbol
  }))
}
