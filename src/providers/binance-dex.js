const axios = require('axios')
  .create({
    baseURL: 'https://dex.binance.org/api/v1/',
    timeout: 180000
  })

function mapBySymbol(data) {
  return data.reduce((memo, item) => {
    memo[item.original_symbol.toLowerCase()] = item
    return memo
  }, {})
}

exports.getBep2Tokens = function getBep2Tokens() {
  return axios
    .get('/tokens?limit=1000')
    .then(resp => mapBySymbol(resp.data))
    .catch(err => {
      console.error(err)
      return {}
    })
}
