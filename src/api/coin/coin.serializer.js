function descriptionsFromCoin(coinDescriptions) {
  return coinDescriptions.map(description => ({
    language_id: description.LanguageId,
    content: description.content
  }))
}

function descriptionsFromCoinInfo(coinInfo, languages) {
  return languages.reduce((result, language) => {
    const description = coinInfo.description[language.id]

    if (description) {
      result.push({
        language_id: language.id,
        content: description
      })
    }

    return result
  }, [])
}

module.exports = {

  serialize: (coin, coinInfo, languages) => {
    const platforms = coin.PlatformReferences.map(reference => ({
      id: reference.PlatformId,
      value: reference.value,
    }))

    const categoryIds = coin.Categories.map(category => (category.id))

    const descriptions = coin.CoinDescriptions.length
      ? descriptionsFromCoin(coin.CoinDescriptions)
      : descriptionsFromCoinInfo(coinInfo, languages)

    return {
      id: coin.id,
      name: coin.name,
      code: coin.code,
      platforms,
      category_ids: categoryIds,
      descriptions,
      // coinInfo
    }
  }

}
