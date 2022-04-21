const axios = require('axios').create({
  baseURL: 'https://snowtrace.io',
  timeout: 180000
})

exports.getHolders = address => {
  return axios.get(`/token/tokenholderchart/${address}?range=10`).then(res => res.data)
}

exports.getAccounts = () => {
  return axios.get('/accounts').then(res => res.data)
}
