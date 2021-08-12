function descriptionFromCoin(coinDescriptions, language) {
  let description = coinDescriptions.find(desc => desc.Language.code === language)

  if (!description) {
    description = coinDescriptions.find(desc => desc.Language.code === 'en')
  }

  return description ? description.content : null
}

function descriptionFromCoinInfo(coinInfo, language) {
  return coinInfo.description[language]
}

module.exports = {

  serialize: (coin, coinInfo, language, currency) => {
    const platforms = coin.PlatformReferences.map(reference => ({
      uid: reference.Platform.uid,
      value: reference.value,
    }))

    const categoryUids = coin.Categories.map(category => (category.uid))

    const description = descriptionFromCoin(coin.CoinDescriptions, language)
      || descriptionFromCoinInfo(coinInfo, language)

    return {
      uid: coin.uid,
      name: coin.name,
      code: coin.code,
      rate: coinInfo.market_data.current_price[currency],
      market_cap: coinInfo.market_data.market_cap[currency],
      market_cap_rank: coinInfo.market_cap_rank,
      circulating_supply: coinInfo.market_data.circulating_supply,
      total_supply: coinInfo.market_data.total_supply,
      fully_diluted_valuation: coinInfo.market_data.fully_diluted_valuation[currency],
      total_volume: coinInfo.market_data.total_volume[currency],
      genesis_date: coinInfo.genesis_date,
      platforms,
      category_uids: categoryUids,
      description,
      links: {
        website: coinInfo.links.homepage[0],
        // whitepaper: "",
        // guide: "",
        twitter: coinInfo.links.twitter_screen_name,
        github: coinInfo.links.repos_url.github[0],
        reddit: coinInfo.links.subreddit_url,
        telegram: coinInfo.links.telegram_channel_identifier
      },
      price_change_percentage_in_currency: {
        usd: {
          '7d': coinInfo.market_data.price_change_percentage_7d_in_currency.usd,
          '30d': coinInfo.market_data.price_change_percentage_30d_in_currency.usd,
        },
        btc: {
          '7d': coinInfo.market_data.price_change_percentage_7d_in_currency.btc,
          '30d': coinInfo.market_data.price_change_percentage_30d_in_currency.btc,
        },
        eth: {
          '7d': coinInfo.market_data.price_change_percentage_7d_in_currency.eth,
          '30d': coinInfo.market_data.price_change_percentage_30d_in_currency.eth,
        },
      },
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
