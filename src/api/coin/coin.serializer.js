function descriptionFromCoin(coinDescriptions, language) {
  let description = coinDescriptions.find(desc => desc.LanguageId === language)

  if (!description) {
    description = coinDescriptions.find(desc => desc.LanguageId === 'en')
  }

  return description ? description.content : null
}

function descriptionFromCoinInfo(coinInfo, language) {
  return coinInfo.description[language]
}

module.exports = {

  serialize: (coin, coinInfo, language, currency) => {
    const platforms = coin.PlatformReferences.map(reference => ({
      id: reference.PlatformId,
      value: reference.value,
    }))

    const categoryIds = coin.Categories.map(category => (category.id))

    const description = descriptionFromCoin(coin.CoinDescriptions, language)
      || descriptionFromCoinInfo(coinInfo, language)

    return {
      id: coin.id,
      name: coin.name,
      code: coin.code,
      rate: coinInfo.market_data.current_price[currency],
      market_cap: coinInfo.market_data.market_cap[currency],
      market_cap_rank: coinInfo.market_cap_rank,
      circulating_supply: coinInfo.market_data.circulating_supply,
      total_supply: coinInfo.market_data.total_supply,
      fully_diluted_valuation: coinInfo.market_data.fully_diluted_valuation[currency],
      genesis_date: coinInfo.genesis_date,
      platforms,
      category_ids: categoryIds,
      description,
      coinInfo
    }
  }

}
