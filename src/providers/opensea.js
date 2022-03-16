const querystring = require('querystring')
const axios = require('axios').create({
  baseURL: 'https://api.opensea.io/api/v1',
  timeout: 180000,
  headers: { 'X-API-KEY': process.env.OPENSEA_KEY }
})

const normalizer = require('./opensea-normalizer')

class Opensea {

  getCollections(assetOwner, offset = 0, limit = 20) {
    const params = {
      limit,
      offset,
      ...assetOwner && { asset_owner: assetOwner }
    }

    return axios
      .get(`/collections?${querystring.stringify(params)}`)
      .then(({ data }) => normalizer.normalizeCollections(data.collections || data))
  }

  getCollection(collectionUid) {
    return axios
      .get(`/collection/${collectionUid}`)
      .then(({ data }) => normalizer.normalizeCollection(data.collection || data))
      .catch(e => {
        console.error(e)
        return null
      })
  }

  getAssets(owner, tokenIds, contractAddresses, collectionUid, cursor, includeOrders = false, orderDirection = 'desc', limit = 20) {
    const params = {
      limit,
      order_direction: orderDirection,
      include_orders: includeOrders,
      ...owner && { owner },
      ...cursor && { cursor },
      ...tokenIds && { token_ids: tokenIds.split(',') },
      ...collectionUid && { collection_slug: collectionUid },
      ...contractAddresses && { asset_contract_addresses: contractAddresses.split(',') }
    }

    return axios
      .get(`/assets?${querystring.stringify(params)}`)
      .then(({ data }) => normalizer.normalizeAssets(data))
  }

  getAsset(contractAddress, tokenId, accountAddress, includeOrders = false) {
    const params = {
      include_orders: includeOrders,
      ...accountAddress && { account_address: accountAddress }
    }

    return axios
      .get(`/asset/${contractAddress}/${tokenId}?${querystring.stringify(params)}`)
      .then(({ data }) => normalizer.normalizeAsset(data))
  }

}

module.exports = new Opensea()
