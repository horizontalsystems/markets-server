const axios = require('axios').create({
  baseURL: 'https://public-api.solscan.io',
  timeout: 180000
})

exports.getMeta = address => {
  return axios.get(`/token/meta?tokenAddress=${address}`).then(res => res.data)
}
