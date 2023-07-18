const { create: createAxios } = require('axios')
const { stringify } = require('querystring')

const api = createAxios({ baseURL: 'https://api.llama.fi', timeout: 180000 * 3 })
const coinsApi = createAxios({ baseURL: 'https://coins.llama.fi', timeout: 180000 * 3 })
const stablecoinsApi = createAxios({ baseURL: 'https://stablecoins.llama.fi', timeout: 180000 * 3 })
const nftApi = createAxios({ baseURL: 'https://nft.llama.fi', timeout: 180000 * 3 })

const { normalize, normalizeRevenue } = require('./normalizers/defillama-normalizer')

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
    return data.filter(item => item.category !== 'Bridge' && item.category !== 'Chain' && item.category !== 'CEX')
  })
}

exports.getChains = () => {
  console.log('Fetching DeFi chains')

  return api.get('/chains')
    .then(({ data = [] }) => {
      return data
    })
    .catch(e => {
      console.log(e)
      return []
    })
}

exports.getProtocol = id => {
  console.log(`Fetching defi protocol info ${id}`)

  return api.get(`/protocol/${id}`)
    .then(resp => resp.data.gecko_id)
}

exports.getPrices = coins => {
  const addresses = coins.join(',')

  return coinsApi.get(`/prices/current/${addresses}`)
    .then(resp => (resp.data || {}).coins || {})
    .catch(e => {
      console.error(e)
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
      console.error(e)
      return {}
    })
}

exports.getNftCollections = (limit = 100) => {
  console.log('Fetching NFT Collections')

  return nftApi.get(`/collections?limit=${limit}`)
    .then(resp => resp.data.data)
}

exports.getRevenue = isFee => {
  console.log('Fetching', isFee ? 'fee' : 'revenue')

  const params = stringify({
    excludeTotalDataChart: true,
    excludeTotalDataChartBreakdown: true,
    dataType: isFee ? 'dailyFees' : 'dailyRevenue'
  })

  return api.get(`/overview/fees?${params}`)
    .then(({ data }) => {
      if (!data || !data.protocols) {
        return []
      }

      return normalizeRevenue(data.protocols, isFee)
    })
    .catch(e => {
      console.error(e)
      return []
    })
}
