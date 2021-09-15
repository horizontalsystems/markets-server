function platforms(platforms) {
  return platforms.map(platform => ({
    type: platform.type,
    decimal: platform.decimal,
    reference: platform.reference,
  }))
}

module.exports = {

  serializeSearchResult: coins => {
    return coins.map(coin => ({
      uid: coin.uid,
      name: coin.name,
      code: coin.code,
      coingecko_id: coin.coingecko_id,
      price: coin.price,
      price_change_24h: coin.price_change['24h'],
      market_cap: coin.market_data.market_cap,
      total_volume: coin.market_data.total_volume,
      platforms: platforms(coin.Platforms),
    }))
  },

  serialize: ({ Categories, Platforms, ...coin }) => {
    return {
      ...coin,
      platforms: platforms(Platforms),
      category_ids: Categories.map(category => category.uid)
    }
  }

}
