const { DateTime } = require('luxon')
const querystring = require('querystring')
const axios = require('axios')
  .create({
    baseURL: 'https://api.coingecko.com/api/v3',
    timeout: 180000
  })

// -------------- NON API REQUESTS -------------------
const axiosNonAPI = require('axios')
  .create({
    baseURL: 'https://www.coingecko.com',
    timeout: 180000
  })

exports.getMarketDominance = function getMarketDominance(duration = 60) {
  const query = querystring.stringify({
    duration
  })

  return axiosNonAPI
    .get(`/global_charts/market_dominance_data?${query}`)
    .then(resp => resp.data) // eslint-disable-line
}

exports.getTotalChartsData = function getTotalChartsData(currency = 'usd') {
  const query = querystring.stringify({
    vs_currency: currency
  })

  return axiosNonAPI
    .get(`/market_cap/total_charts_data?${query}`)
    .then(resp => resp.data) // eslint-disable-line
}

exports.getDefiMarketCapData = function getDefiMarketCapData(duration = 60, currency = 'usd') {
  const query = querystring.stringify({
    duration,
    vs_currency: currency
  })

  return axiosNonAPI
    .get(`/en/defi_market_cap_data?${query}`)
    .then(resp => resp.data) // eslint-disable-line
}
// ---------------------------------------------------

exports.getGlobalMarkets = function getGlobalMarkets() {
  return axios
    .get('/global')
    .then(resp => resp.data) // eslint-disable-line
}

exports.getGlobalDefiMarkets = function getGlobalDefiMarkets() {
  return axios
    .get('/global/decentralized_finance_defi')
    .then(resp => resp.data) // eslint-disable-line
}

exports.getMarketsChart = function getMarketsChart(coinId, currency, timestampFrom, timestampTo) {
  const query = querystring.stringify({
    vs_currency: currency,
    from: timestampFrom,
    to: timestampTo
  })

  return axios
    .get(`/coins/${coinId}/market_chart/range?${query}`)
    .then(resp => resp.data) // eslint-disable-line
}

exports.getLatestCoinPrice = function getLatestCoinPrice(coinIds, currencies) {
  const query = querystring.stringify({
    ids: coinIds.join(','),
    vs_currencies: currencies.join(','),
  })

  return axios
    .get(`/simple/price?${query}`)
    .then(resp => resp.data) // eslint-disable-line
}

exports.getMarkets = function getMarkets(coinIds, page, perPage) {
  const params = {
    vs_currency: 'usd',
    sparkline: false,
    order: 'market_cap_rank_desc',
    price_change_percentage: '24h,7d,14d,30d,200d,1y'
  }

  if (page && perPage) {
    params.page = page
    params.per_page = perPage
  }

  if (coinIds) {
    params.ids = coinIds.join(',')
  }

  return axios
    .get(`/coins/markets?${querystring.stringify(params)}`)
    .then(resp => normalizeMarkets(resp.data)) // eslint-disable-line
}

exports.getCoinInfo = function getMarketInfo(id) {
  const query = querystring.stringify({
    tickers: false,
    market_data: true,
    community_data: true,
    developer_data: true
  })

  return axios
    .get(`/coins/${id}?${query}`)
    .then(resp => normalizeCoin(resp.data)) // eslint-disable-line
}

function normalizeMarkets(markets) {
  const updatedDate = DateTime.now().toISO()
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

    last_updated: updatedDate
  }))
}

function normalizeCoin(coin) {
  const market = coin.market_data

  return {
    uid: coin.id,
    name: coin.name,
    code: coin.symbol,
    description: coin.description,
    coingecko_id: coin.id,
    genesis_date: coin.genesis_date,
    platforms: coin.platforms,

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
      '30d': market.price_change_percentage_30d,
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

    is_defi: coin.categories.contains('Decentralized Finance (DeFi)'),
    last_updated: coin.last_updated
  }
}
