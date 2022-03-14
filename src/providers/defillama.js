const axios = require('axios').create({
  baseURL: 'https://api.llama.fi',
  timeout: 180000 * 3
})

const axiosNft = require('axios').create({
  baseURL: 'https://ybrjmu6r60.execute-api.eu-west-2.amazonaws.com/prod',
  timeout: 180000 * 3
})

const normalizer = require('./defillama-normalizer')

exports.getCharts = (chain) => {
  const url = chain
    ? `/charts/${chain}`
    : '/charts'

  console.log('Fetching TVL history', chain)

  return axios.get(url)
    .then(resp => resp.data)
    .catch(e => {
      console.error(e)
      return []
    })
}

exports.getProtocols = () => {
  console.log('Fetching DeFi protocols')

  return axios.get('/protocols').then(({ data = [] }) => {
    return data.filter(item => item.slug !== 'polygon-bridge-&-staking')
  })
}

exports.getProtocol = id => {
  console.log(`Fetching defi protocol info ${id}`)

  return axios.get(`/protocol/${id}`)
    .then(resp => resp.data)
}

exports.getNftCollections = () => {
  console.log('Fetching NFT Collections')

  return axiosNft.get('/collections')
    .then(resp => resp.data.data)
}

exports.getNftCollection = uid => {
  console.log(`Fetching NFT ${uid} collection`)

  return axiosNft.get(`/collection/${uid}`).then(resp => {
    if (Object.values(resp.data).length > 0) {
      return normalizer.normalizeNftCollection(resp.data[0])
    }

    return {}
  })
}
