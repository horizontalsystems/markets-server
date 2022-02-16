const axios = require('axios').create({
  baseURL: 'https://api.opensea.io/api/v1',
  timeout: 180000,
  headers: { 'X-API-KEY': process.env.OPENSEA_KEY }
})

const normalizer = require('./opensea-normalizer')

class Opensea {

  getCollections(assetOwner, offset = 0, limit = 20) {

    const query = `limit=${limit}&offset=${offset}${assetOwner ? `&asset_owner=${assetOwner}` : ''}`

    return axios
      .get(`/collections?${query}`)
      .then(resp => normalizer.normalizeCollections(resp.data))
  }

  getCollection(collectionUid) {
    return axios
      .get(`/collection/${collectionUid}`)
      .then(resp => normalizer.normalizeCollection(resp.data))
  }

  getAssets(owner, tokenIds, contractAddresses, collectionUid, orderDirection = 'desc', offset = 0, limit = 20) {

    let query = `limit=${limit}&offset=${offset}&order_direction=${orderDirection}`
    query += `${owner ? `&owner=${owner}` : ''}`
    query += `${contractAddresses ? `&asset_contract_addresses=${contractAddresses}` : ''}`
    query += `${collectionUid ? `&collection=${collectionUid}` : ''}`

    if (tokenIds) {
      tokenIds.forEach(i => {
        query += `&token_ids=${i}`
      })
    }

    if (contractAddresses) {
      contractAddresses.forEach(i => {
        query += `&asset_contract_addresses=${i}`
      })
    }

    return axios
      .get(`/assets?${query}`)
      .then(resp => normalizer.normalizeAssets(resp.data))
  }

  getAsset(assetContractAddress, tokenId, accountAddress) {

    const query = `${accountAddress ? `&account_address=${accountAddress}` : ''}`

    return axios
      .get(`/asset/${assetContractAddress}/${tokenId}?${query}`)
      .then(resp => normalizer.normalizeAsset(resp.data))
  }

}

module.exports = new Opensea()
