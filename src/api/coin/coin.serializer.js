function descriptionFromCoin(coinDescriptions, language) {
  let description = coinDescriptions.find(desc => desc.Language.code === language)

  if (!description) {
    description = coinDescriptions.find(desc => desc.Language.code === 'en')
  }

  return description ? description.content : null
}

function platforms(platforms) {
  return platforms.map(platform => ({
    type: platform.type,
    decimal: platform.decimal,
    reference: platform.reference,
  }))
}

module.exports = {

  serializeSearchResult: (coins) => {
    return coins.map(coin => ({
      uid: coin.uid,
      name: coin.name,
      code: coin.code,
      platforms: platforms(coin.Platforms),
      coingecko_id: coin.coingecko_id,
      market_cap: coin.market_cap,
      total_volume: coin.total_volume
    }))
  },

  serialize: ({ Categories, CoinDescriptions, Platforms, ...coin }, language) => {
    const categoryIds = Categories.map(category => (category.uid))
    const description = descriptionFromCoin(CoinDescriptions, language)

    return {
      ...coin,
      platforms: platforms(Platforms),
      category_ids: categoryIds,
      description
    }
  }

}
