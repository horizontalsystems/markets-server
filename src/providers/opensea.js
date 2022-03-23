const { stringify } = require('querystring')
const axios = require('axios').create({
  baseURL: 'https://api.opensea.io/api/v1',
  timeout: 180000,
  headers: { 'X-API-KEY': process.env.OPENSEA_KEY }
})

const normalizer = require('./opensea-normalizer')

class Opensea {

  getEvents(eventType, accountAddress, collectionUid, assetContract, tokenId, occuredBefore, cursor) {
    const getEventType = () => {
      switch (eventType) {
        case 'sale':
          return 'successful'
        case 'list':
          return 'created'
        case 'bid':
          return 'bid_entered'
        case 'bid_cancel':
          return 'bid_withdrawn'
        default:
          return eventType
      }
    }

    const params = {
      only_opensea: false,
      ...eventType && { event_type: getEventType() },
      ...accountAddress && { account_address: accountAddress },
      ...collectionUid && { collection_slug: collectionUid },
      ...tokenId && { token_id: tokenId },
      ...assetContract && { asset_contract_address: assetContract },
      ...occuredBefore && { occured_before: occuredBefore },
      ...cursor && { cursor }
    }

    return axios
      .get(`/events?${stringify(params)}`)
      .then(({ data }) => normalizer.normalizeEvents(data))
  }

  getCollections(assetOwner, offset = 0, limit = 20) {
    const params = {
      limit,
      offset,
      ...assetOwner && { asset_owner: assetOwner }
    }

    return axios
      .get(`/collections?${stringify(params)}`)
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

  getCollectionStats(collectionUid) {
    return axios
      .get(`/collection/${collectionUid}/stats`)
      .then(resp => resp.data.stats)
      .catch(e => {
        console.error(e)
        return null
      })
  }

  getAssets(owner, collectionUid, tokenIds, contractAddresses, cursor, includeOrders = false, orderDirection = 'desc', limit = 20, offset = 0) {
    const params = {
      limit,
      order_direction: orderDirection,
      include_orders: includeOrders,
      ...owner && { owner },
      ...cursor && { cursor },
      ...offset && { offset },
      ...tokenIds && { token_ids: tokenIds.split(',') },
      ...collectionUid && { collection_slug: collectionUid },
      ...contractAddresses && { asset_contract_addresses: contractAddresses.split(',') }
    }

    return axios
      .get(`/assets?${stringify(params)}`)
      .then(({ data }) => {
        const result = normalizer.normalizeAssets(data)
        return offset ? result.assets : result
      })
  }

  getAsset(contractAddress, tokenId, accountAddress, includeOrders = false) {
    const params = {
      include_orders: includeOrders,
      ...accountAddress && { account_address: accountAddress }
    }

    return axios
      .get(`/asset/${contractAddress}/${tokenId}?${stringify(params)}`)
      .then(({ data }) => normalizer.normalizeAsset(data))
  }

}

module.exports = new Opensea()
