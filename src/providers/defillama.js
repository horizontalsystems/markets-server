const createAxios = require('axios').create

const api = createAxios({ baseURL: 'https://api.llama.fi', timeout: 180000 * 3 })
const coinsApi = createAxios({ baseURL: 'https://coins.llama.fi', timeout: 180000 * 3 })
const stablecoinsApi = createAxios({ baseURL: 'https://stablecoins.llama.fi', timeout: 180000 * 3 })
const nftApi = createAxios({ baseURL: 'https://ybrjmu6r60.execute-api.eu-west-2.amazonaws.com/prod', timeout: 180000 * 3 })

const { normalize } = require('./normalizers/defillama-normalizer')

exports.getCharts = (chain) => {
  const url = chain
    ? `/charts/${chain}`
    : '/charts'

  console.log('Fetching TVL history', chain)

  return api.get(url)
    .then(resp => resp.data)
    .catch(e => {
      console.error(e)
      return []
    })
}

exports.getProtocols = () => {
  console.log('Fetching DeFi protocols')

  return api.get('/protocols').then(({ data = [] }) => {
    return data.filter(item => item.slug !== 'polygon-bridge-&-staking')
  })
}

exports.getProtocol = id => {
  console.log(`Fetching defi protocol info ${id}`)

  return api.get(`/protocol/${id}`)
    .then(resp => resp.data)
}

exports.getPrices = platforms => {
  const addresses = platforms
    .map(item => [`${item.chain_uid}:${item.address}`])
    .join(',')

  console.log('Fetching staked coins prices')

  return coinsApi.get(`/prices/current/${addresses}`)
    .then(resp => (resp.data || {}).coins || {})
    .catch(e => {
      console.log(e)
      return []
    })
}

exports.getStablecoins = () => {
  console.log('Fetching stablecoins')

  return stablecoinsApi.get('stablecoins')
    .then(({ data }) => {
      if (!data || !data.peggedAssets) {
        return {}
      }

      return normalize(data.peggedAssets)
    })
    .catch(e => {
      console.log(e)
      return {}
    })
}

exports.getNftCollections = (limit = 100) => {
  console.log('Fetching NFT Collections')

  return nftApi.get(`/collections?limit=${limit}`)
    .then(resp => resp.data.data)
}
