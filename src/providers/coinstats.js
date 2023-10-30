const querystring = require('querystring')
const createAxios = require('axios').create
const { normalizeMarkets, normalizeFiatRates } = require('./normalizers/coinstats-normalizer')

const axios = createAxios({
  baseURL: 'https://api.coin-stats.com/v4',
  timeout: 180000
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

  return axios.get(`/coins?${querystring.stringify(params)}`)
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
  return axios.get('/fiats')
    .then(({ data = {} }) => {
      return normalizeFiatRates(data)
    })
}
