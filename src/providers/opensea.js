const querystring = require('querystring')
const axios = require('axios').create({
  baseURL: 'https://api.opensea.io/api/v1',
  timeout: 180000,
  headers: { 'X-API-KEY': process.env.OPENSEA_KEY }
})

const normalizer = require('./opensea-normalizer')

class Opensea {

  getCollections(assetOwner, offset = 0, limit = 20) {

    const params = { limit, offset }

    if (assetOwner) {
      params.asset_owner = assetOwner
    }

    return axios
      .get(`/collections?${querystring.stringify(params)}`)
      .then(resp => normalizer.normalizeCollections(resp.data))
  }

  getCollection(collectionUid) {
    return axios
      .get(`/collection/${collectionUid}`)
      .then(resp => normalizer.normalizeCollection(resp.data))
  }

  getAssets(owner, tokenIds, contractAddresses, collectionUid, orderDirection = 'desc', offset = 0, limit = 20) {

    const params = { limit, offset, order_direction: orderDirection }

    if (owner) {
      params.owner = owner
    }

    if (collectionUid) {
      params.collection = collectionUid
    }

    if (tokenIds) {
      params.token_ids = tokenIds.split(',')
    }

    if (contractAddresses) {
      params.asset_contract_addresses = contractAddresses.split(',')
    }

    return axios
      .get(`/assets?${querystring.stringify(params)}`)
      .then(resp => normalizer.normalizeAssets(resp.data))
  }

  getAsset(assetContractAddress, tokenId, accountAddress) {

    const params = `${accountAddress ? `&account_address=${accountAddress}` : ''}`

    return axios
      .get(`/asset/${assetContractAddress}/${tokenId}?${querystring.stringify(params)}`)
      .then(resp => normalizer.normalizeAsset(resp.data))
  }

}

module.exports = new Opensea()
