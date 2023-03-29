const { DateTime } = require('luxon')

exports.normalizeMarkets = markets => {
  const updatedDate = DateTime.now().toISO()

  return markets.map(coin => ({
    uid: coin.id,
    name: coin.name,
    code: coin.symbol,
    // coingecko_id: coin.id,

    price: coin.price,
    price_change: {
      '24h': coin.priceChange1d,
      '7d': coin.priceChange1w
    },

    market_data: {
      market_cap: coin.marketCap,
      market_cap_rank: coin.rank,
      total_volume: coin.volume,
      total_supply: coin.totalSupply,
      // max_supply: coin.max_supply,
      circulating_supply: coin.availableSupply
    },

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
