const querystring = require('querystring')
const createAxios = require('axios').create
const { normalizeMarkets, normalizeFiatRates } = require('./normalizers/coinstats-normalizer')

const axios = createAxios({
  baseURL: 'https://api.coinstats.app/public/v1',
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

  return axios.get(`/coins?${querystring.stringify(params)}`)
    .then(({ data = {} }) => {
      return data.coins
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
