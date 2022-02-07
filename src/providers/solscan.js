const querystring = require('querystring')
const axios = require('axios').create({
  baseURL: 'https://public-api.solscan.io',
  timeout: 180000
})

exports.getMeta = address => {
  return axios.get(`/token/meta?tokenAddress=${address}`).then(res => res.data)
}

exports.getHolders = address => {
  const query = querystring.stringify({
    offset: 0,
    tokenAddress: address,
    limit: 10
  })

  return axios.get(`/token/holders?${query}`).then(({ data }) => data.data)
}

exports.getTokenInfo = address => {
  return axios.get(`/account/${address}`).then(res => (res.data || {}).tokenInfo)
}
