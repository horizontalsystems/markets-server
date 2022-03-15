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
      .then(
        resp => normalizer.normalizeCollections(resp.data.collections ? resp.data.collections : resp.data)
      )
  }

  getCollection(collectionUid) {
    return axios
      .get(`/collection/${collectionUid}`)
      .then(resp => normalizer.normalizeCollection(resp.data.collection ? resp.data.collection : resp.data))
      .catch(e => {
        console.error(e.message)
        return null
      })
  }

  getAssets(owner, tokenIds, contractAddresses, collectionUid, cursor, includeOrders = false, orderDirection = 'desc', limit = 20) {

    const params = { limit, order_direction: orderDirection, include_orders: includeOrders }

    if (owner) {
      params.owner = owner
    }

    if (collectionUid) {
      params.collection_slug = collectionUid
    }

    if (cursor) {
      params.cursor = cursor
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

  getAsset(assetContractAddress, tokenId, accountAddress, includeOrders = false) {

    const params = `&include_orders=${includeOrders}${accountAddress ? `&account_address=${accountAddress}` : ''}`

    return axios
      .get(`/asset/${assetContractAddress}/${tokenId}?${querystring.stringify(params)}`)
      .then(resp => normalizer.normalizeAsset(resp.data))
  }

}

module.exports = new Opensea()
