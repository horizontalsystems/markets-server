const { isEmpty } = require('lodash')
const axios = require('axios')
  .create({
    baseURL: 'https://dex.binance.org/api/v1/',
    timeout: 180000
  })

let cache = {}

function mapBy(data, field) {
  return data.reduce((memo, item) => {
    const key = item[field]
    memo[key.toUpperCase()] = item
    return memo
  }, {})
}

function getBep2Tokens() {
  return axios
    .get('/tokens?limit=1000')
    .catch(err => {
      console.error(err)
      return {}
    })
}

exports.getBep20Info = async symbol => {
  if (isEmpty(cache)) {
    cache = await getBep2Tokens().then(res => mapBy(res.data, 'symbol'))
  }

  return cache[symbol]
}

exports.getBep2Tokens = async () => {
  return getBep2Tokens().then(res => mapBy(res.data, 'original_symbol'))
}
