const { stringify } = require('querystring')
const { create } = require('axios')

const axios = create({
  baseURL: 'https://api.vaults.fyi',
  timeout: 180000 * 3,
  headers: {
    'x-api-key': process.env.VAULTSFYI_KEY
  }
})

exports.getAllVaults = (page, perPage = 5000) => {
  const params = {
    page,
    perPage,
    minTvl: 100000,
    onlyAppFeatured: true
  }

  return axios.get(`/v2/detailed-vaults?${stringify(params)}`)
    .then(res => res.data)
    .then(res => res.data)
}

exports.getHistory = (address, params) => {
  const query = {
    ...params,
    perPage: 20000
  }

  return axios.get(`/v2/historical/mainnet/${address}?${stringify(query)}`)
    .then(res => res.data)
    .then(res => res.data)
}
