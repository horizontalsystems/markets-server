const { stringify } = require('querystring')
const { create } = require('axios')

const axios = create({
  baseURL: 'https://app.vaults.fyi/api/proxy',
  timeout: 180000 * 3
})

const api = create({
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

  const chains = [
    'mainnet', 'optimism', 'arbitrum', 'polygon', 'gnosis', 'base', 'unichain', 'swellchain', 'celo', 'worldchain', 'berachain', 'ink', 'bsc'
  ].join('&allowedNetworks=')

  return axios.get(`/v2/detailed-vaults?${stringify(params)}&allowedNetworks=${chains}`)
    .then(res => res.data)
    .then(res => res.data)
}

exports.getHistory = (address, chain, params) => {
  const query = {
    ...params,
    perPage: 20000
  }

  return axios.get(`/v2/historical/${chain}/${address}?${stringify(query)}`)
    .then(res => res.data)
    .then(res => res.data)
}
