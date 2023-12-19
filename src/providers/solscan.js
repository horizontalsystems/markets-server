const querystring = require('querystring')
const axios = require('axios').create({
  baseURL: 'https://api.solscan.io/v2',
  timeout: 180000
})

exports.getMeta = address => {
  return axios.get(`/token/meta?token=${address}`).then(res => res.data)
}

exports.getHolders = address => {
  const query = querystring.stringify({
    token: address,
    offset: 0,
    size: 10
  })

  return axios.get(`/token/holders?${query}`).then(({ data }) => data.data)
}

exports.getTokenInfo = address => {
  return axios.get(`/account?address=${address}`).then(({ data }) => (data.data || {}).tokenInfo)
}
