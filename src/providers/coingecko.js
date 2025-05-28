const querystring = require('querystring')
const createAxios = require('axios').create

const apiKey = process.env.COINGECKO_KEY
const axios = createAxios({
  baseURL: `https://${apiKey ? 'pro-' : ''}api.coingecko.com/api/v3`,
  timeout: 180000 * 3,
  params: {
    ...(apiKey && { x_cg_pro_api_key: apiKey })
  }
})

const axiosNonAPI = createAxios({
  baseURL: 'https://www.coingecko.com',
  timeout: 180000 * 3
})

const {
  normalizeCoin,
  normalizeMarkets,
  normalizeDefiMarket,
  normalizeDominance,
  normalizeMarketCapVolume
} = require('./normalizers/coingecko-normalizer')

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

exports.getMarketsChart = function getMarketsChart(coinId, timestampFrom, timestampTo, currencyCode = 'usd') {
  const query = querystring.stringify({
    vs_currency: currencyCode,
    from: timestampFrom,
    to: timestampTo
  })

  return axios
    .get(`/coins/${coinId}/market_chart/range?${query}`)
    .then(resp => resp.data)
    .catch(e => {
      console.log(e.message)

      return {
        prices: [],
        total_volumes: []
      }
    })
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

exports.getSimplePrices = (coinIds) => {
  const params = {
    vs_currencies: 'usd',
    include_market_cap: true,
    include_24hr_vol: true,
    include_24hr_change: true,
    include_last_updated_at: true
  }

  if (coinIds) {
    params.ids = coinIds.join(',')
  }

  return axios
    .get(`/simple/price?${querystring.stringify(params)}`)
    .then(resp => resp.data)
}

exports.getCoinList = function getCoinList() {
  return axios
    .get('/coins/list')
    .then(resp => resp.data)
}

exports.getPlatformList = function getCoinList() {
  return axios
    .get('/asset_platforms')
    .then(resp => resp.data)
    .catch(e => {
      console.error(e)
      return []
    })
}

exports.getCoinInfo = function getMarketInfo(id, options = {}) {
  const query = querystring.stringify({
    tickers: true,
    market_data: true,
    community_data: false,
    developer_data: false,
    localization: false,
    ...options
  })

  return axios
    .get(`/coins/${id}?${query}`)
    .then(resp => normalizeCoin(resp.data))
}

exports.getCoinCategories = id => {
  const query = querystring.stringify({
    tickers: false,
    market_data: false,
    community_data: false,
    developer_data: false,
    localization: false
  })

  return axios
    .get(`/coins/${id}?${query}`)
    .then(({ data }) => {
      return data.categories
    })
}

exports.getCategories = () => {
  return axios
    .get('/coins/categories')
    .then(({ data }) => data)
}

exports.getExchanges = (page = 1, perPage = 250) => {
  return axios
    .get(`/exchanges?${querystring.stringify({ page, per_page: perPage })}`)
    .then(({ data }) => data)
}

exports.getExchange = (id) => {
  return axios.get(`/exchanges/${id}`).then(({ data }) => data)
}

exports.getTickers = function getTickers(id, page = 1) {
  const query = querystring.stringify({
    include_exchange_logo: true,
    order: 'volume_desc',
    page,
  })

  return axios
    .get(`/coins/${id}/tickers?${query}`)
    .then(({ data }) => {
      if (!data || !data.tickers) {
        return []
      }

      return data.tickers
    })
}
