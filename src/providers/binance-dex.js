const axios = require('axios')
  .create({
    baseURL: 'https://dex.binance.org/api/v1/',
    timeout: 180000
  })

let cache = []

function mapBySymbol(data) {
  return data.reduce((memo, item) => {
    memo[item.original_symbol.toLowerCase()] = item
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

exports.getTokenInfo = async symbol => {
  if (!cache.length) {
    cache = await getBep2Tokens().then(resp => resp.data)
  }

  return cache.find(item => item.symbol === symbol)
}

exports.getBep2Tokens = async () => {
  if (cache.length) {
    return mapBySymbol(cache)
  }

  return getBep2Tokens()
    .then(resp => mapBySymbol(resp.data))
}
