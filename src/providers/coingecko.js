const querystring = require('querystring')
const axios = require('axios').create({
  baseURL: 'https://api.coingecko.com/api/v3',
  timeout: 180000
})

const axiosNonAPI = require('axios').create({
  baseURL: 'https://www.coingecko.com',
  timeout: 180000
})

const {
  normalizeCoin,
  normalizeMarkets,
  normalizeDefiMarket,
  normalizeDominance,
  normalizeMarketCapVolume
} = require('./coingecko-normalizer')

exports.getMarketDominance = function getMarketDominance() {
  const query = querystring.stringify({
    duration: 60
  })

  console.log('Fetching market dominance')

  return axiosNonAPI
    .get(`/global_charts/market_dominance_data?${query}`)
    .then(resp => normalizeDominance(resp.data))
}

exports.getTotalChartsData = function getTotalChartsData() {
  const query = querystring.stringify({
    vs_currency: 'usd'
  })

  console.log('Fetching market caps/volumes')

  return axiosNonAPI
    .get(`/market_cap/total_charts_data?${query}`)
    .then(resp => normalizeMarketCapVolume(resp.data))
}

exports.getDefiMarketCapData = function getDefiMarketCapData() {
  const query = querystring.stringify({
    duration: 60,
    vs_currency: 'usd'
  })

  console.log('Fetching defi market caps')

  return axiosNonAPI
    .get(`/en/defi_market_cap_data?${query}`)
    .then(resp => normalizeDefiMarket(resp.data))
}

exports.getGlobalMarkets = function getGlobalMarkets() {
  console.log('Fetching global markets data')

  return axios
    .get('/global')
    .then(resp => resp.data.data)
}

exports.getGlobalDefiMarkets = function getGlobalDefiMarkets() {
  console.log('Fetching global defi markets data')

  return axios
    .get('/global/decentralized_finance_defi')
    .then(resp => resp.data.data)
}

exports.getMarketsChart = function getMarketsChart(coinId, currency, timestampFrom, timestampTo) {
  const query = querystring.stringify({
    vs_currency: currency,
    from: timestampFrom,
    to: timestampTo
  })

  return axios
    .get(`/coins/${coinId}/market_chart/range?${query}`)
    .then(resp => resp.data)
}

exports.getLatestCoinPrice = function getLatestCoinPrice(coinIds, currencies) {
  const query = querystring.stringify({
    ids: coinIds.join(','),
    vs_currencies: currencies.join(','),
  })

  return axios
    .get(`/simple/price?${query}`)
    .then(resp => resp.data)
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
    .then(resp => normalizeMarkets(resp.data))
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
    .then(resp => normalizeCoin(resp.data))
}
