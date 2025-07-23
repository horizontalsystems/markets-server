const { stringify } = require('querystring')
const { create } = require('axios')

const axios = create({
  baseURL: 'https://app.vaults.fyi/api/proxy',
  timeout: 180000 * 3
})

exports.getAllVaults = (page, perPage = 5000) => {
  const params = {
    page,
    perPage,
    minTvl: 100000,
    onlyAppFeatured: true
  }

  return axios.get(`/v2/detailed-vaults?${stringify(params)}&allowedNetworks=mainnet&allowedNetworks=optimism&allowedNetworks=arbitrum&allowedNetworks=polygon&allowedNetworks=gnosis&allowedNetworks=base&allowedNetworks=unichain&allowedNetworks=swellchain&allowedNetworks=celo&allowedNetworks=worldchain&allowedNetworks=berachain&allowedNetworks=ink&allowedNetworks=bsc`)
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
