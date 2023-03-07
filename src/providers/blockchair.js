const axios = require('axios').create({
  baseURL: 'https://api.blockchair.com',
  timeout: 180000
})

exports.getAddresses = (chain, limit = 10) => {
  console.log(`Fetching Holders for  ${chain} ...`)

  return axios.get(`/${chain}/addresses/?limit=${limit}`)
    .then(res => res.data)
}
