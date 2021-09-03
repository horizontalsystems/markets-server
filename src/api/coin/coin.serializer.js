function descriptionFromCoin(coinDescriptions, language) {
  let description = coinDescriptions.find(desc => desc.Language.code === language)

  if (!description) {
    description = coinDescriptions.find(desc => desc.Language.code === 'en')
  }

  return description ? description.content : null
}

function platforms(coin) {
  return coin.Platforms.map(platform => ({
    type: platform.type,
    decimal: platform.decimal,
    reference: platform.reference,
  }))
}

module.exports = {

  serializeSearchResult: (coins) => {
    // const sortedCoins = coins.sort((coinA, coinB) => (
    //   coinA.market_cap_rank - coinB.market_cap_rank
    // ))

    return coins.map(coin => ({
      uid: coin.uid,
      name: coin.name,
      code: coin.code,
      decimal: coin.decimal,
      platforms: platforms(coin),
      market_cap_rank: coin.market_cap_rank,
      coingecko_id: coin.coingecko_id,
    }))
  },

  serialize: (coin, coinInfo, language) => {
    const categoryUids = coin.Categories.map(category => (category.uid))

    const description = descriptionFromCoin(coin.CoinDescriptions, language)
      || coinInfo.description

    return {
      uid: coin.uid,
      name: coin.name,
      code: coin.code,
      rate: coinInfo.rate,
      market_cap: coinInfo.market_cap,
      market_cap_rank: coinInfo.market_cap_rank,
      circulating_supply: coinInfo.circulating_supply,
      total_supply: coinInfo.total_supply,
      fully_diluted_valuation: coinInfo.fully_diluted_valuation,
      total_volume: coinInfo.total_volume,
      genesis_date: coinInfo.genesis_date,
      links: coinInfo.links,
      price_change_percentage_in_currency: coinInfo.price_change_percentage_in_currency,
      platforms: platforms(coin),
      category_uids: categoryUids,
      description,
      security: {
        privacy: coin.privacy,
        decentralized: coin.decentralized,
        confiscation_resistance: coin.confiscation_resistance,
        censorship_resistance: coin.censorship_resistance,
      },
      // coinInfo
    }
  }

}
