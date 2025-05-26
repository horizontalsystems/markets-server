const querystring = require('querystring')
const createAxios = require('axios').create
const { normalizeMarkets, normalizeFiatRates } = require('./normalizers/coinstats-normalizer')

const axios = createAxios({
  baseURL: 'https://api.coin-stats.com/v4',
  timeout: 180000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36'
  }
})

const openapi = createAxios({
  baseURL: 'https://openapiv1.coinstats.app',
  timeout: 180000,
  headers: {
    'X-API-KEY': process.env.COINSTATS_KEY
  }
})

exports.getGlobalMarkets = function getGlobalMarkets() {
  console.log('Fetching global markets data')

  return axios
    .get('/global')
    .then(resp => resp.data.data)
}

exports.getCoins = (skip, limit) => {
  const params = {
    currency: 'usd',
    skip,
    limit
  }

  const normalize = data => {
    return {
      id: data.i,
      price: data.pu,
      volume: data.v
    }
  }

  const url = `/coins?${querystring.stringify(params)}`
  console.log(url)
  return axios.get(url)
    .then(({ data = { coins: [] } }) => {
      return data.coins.map(normalize)
    })
}

exports.getMarkets = (skip, limit) => {
  const params = {
    currency: 'usd',
    skip,
    limit
  }

  return axios.get(`/coins?${querystring.stringify(params)}`)
    .then(({ data = {} }) => {
      return normalizeMarkets(data.coins)
    })
}

exports.getFiatRates = () => {
  return openapi.get('/fiats')
    .then(({ data = {} }) => {
      return normalizeFiatRates(data)
    })
}
