const { DateTime } = require('luxon')

exports.normalizeMarkets = markets => {
  const updatedDate = DateTime.now().toISO()
  const getImagePath = image => {
    try {
      const url = new URL(image)
      return url.pathname.replace('/coins/images', '')
    } catch (e) {
      return ''
    }
  }

  return markets.map(coin => ({
    uid: coin.id,
    name: coin.name,
    code: coin.symbol,
    coingecko_id: coin.id,

    price: coin.current_price,
    price_change: {
      '24h': coin.price_change_percentage_24h,
      '14d': coin.price_change_percentage_14d_in_currency,
      '7d': coin.price_change_percentage_7d_in_currency,
      '30d': coin.price_change_percentage_30d_in_currency,
      '200d': coin.price_change_percentage_200d_in_currency,
      '1y': coin.price_change_percentage_1y_in_currency,
      high_24h: coin.high_24h,
      low_24h: coin.low_24h,
      ath: coin.ath,
      ath_change_percentage: coin.ath_change_percentage,
      ath_date: coin.ath_date,
      atl: coin.atl,
      atl_change_percentage: coin.atl_change_percentage,
      atl_date: coin.atl_date,
    },

    market_data: {
      market_cap: coin.market_cap,
      market_cap_rank: coin.market_cap_rank,
      total_volume: coin.total_volume,
      total_supply: coin.total_supply,
      max_supply: coin.max_supply,
      circulating_supply: coin.circulating_supply,
      fully_diluted_valuation: coin.fully_diluted_valuation,
      total_value_locked: (coin.total_value_locked || {}).usd
    },

    img_path: getImagePath(coin.image),

    last_updated: updatedDate
  }))
}

exports.normalizeCoin = coin => {
  const market = coin.market_data

  return {
    uid: coin.id,
    name: coin.name,
    code: coin.symbol,
    description: coin.description,
    coingecko_id: coin.id,
    genesis_date: coin.genesis_date,
    platforms: coin.platforms,
    detail_platforms: coin.detail_platforms,
    tickers: coin.tickers,

    links: {
      website: coin.links.homepage[0],
      twitter: coin.links.twitter_screen_name,
      github: coin.links.repos_url.github[0],
      reddit: coin.links.subreddit_url,
      telegram: coin.links.telegram_channel_identifier
    },

    price: market.current_price.usd,
    price_change: {
      '24h': market.price_change_percentage_24h,
      '7d': market.price_change_percentage_7d,
      '14d': market.price_change_percentage_14d,
      '30d': market.price_change_percentage_30d,
      '200d': market.price_change_percentage_200d,
      '1y': market.price_change_percentage_1y,
      high_24h: market.high_24h.usd,
      low_24h: market.low_24h.usd,
      ath: market.ath.usd,
      ath_change_percentage: market.ath_change_percentage.usd,
      ath_date: market.ath_date.usd,
      atl: market.atl.usd,
      atl_change_percentage: market.atl_change_percentage.usd,
      atl_date: market.atl_date.usd,
    },

    market_data: {
      market_cap: market.market_cap.usd,
      market_cap_rank: market.market_cap_rank,
      total_volume: market.total_volume.usd,
      total_supply: market.total_supply,
      max_supply: market.max_supply,
      circulating_supply: market.circulating_supply,
      fully_diluted_valuation: market.fully_diluted_valuation.usd,
      total_value_locked: (market.total_value_locked || {}).usd,
    },

    is_defi: coin.categories.includes('Decentralized Finance (DeFi)'),
    last_updated: coin.last_updated
  }
}

exports.normalizeDefiMarket = data => {
  return data.find(item => item.name === 'DeFi') || {}
}

exports.normalizeDominance = data => {
  if (!data || !data.series_data_array) {
    return []
  }

  return data.series_data_array.find(item => item.name === 'BTC') || []
}

exports.normalizeMarketCapVolume = data => {
  return {
    marketCaps: data.stats,
    totalVolumes: data.total_volumes
  }
}
