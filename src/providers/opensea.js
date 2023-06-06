const { stringify } = require('querystring')
const { create } = require('axios')
const {
  normalizeCollection,
  normalizeCollections,
  normalizeEvents,
  normalizeAssets,
  normalizeAsset
} = require('./normalizers/opensea-normalizer')

const api = create({
  baseURL: 'https://api.opensea.io/api/v1',
  timeout: 180000,
  headers: { 'X-API-KEY': process.env.OPENSEA_KEY }
})

const apiPro = create({
  baseURL: 'https://api.pro.opensea.io',
  timeout: 180000,
  headers: { 'User-Agent': 'Unstoppable' }
})

class Opensea {

  proxyEvents(params) {
    return api.get(`/events?${stringify(params)}`)
  }

  getEvents(eventType, accountAddress, collectionUid, assetContract, tokenId, occuredBefore, cursor) {
    const getEventType = () => {
      switch (eventType) {
        case 'sale':
          return 'successful'
        case 'list':
          return 'created'
        case 'offer':
          return 'offer_entered'
        case 'bid':
          return 'bid_entered'
        case 'bid_cancel':
          return 'bid_withdrawn'
        case 'transfer':
          return 'transfer'
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

    return api
      .get(`/events?${stringify(params)}`)
      .then(({ data }) => normalizeEvents(data))
  }

  getCollections(assetOwner, offset = 0, limit = 20) {
    const params = {
      limit,
      offset,
      ...assetOwner && { asset_owner: assetOwner }
    }

    return api
      .get(`/collections?${stringify(params)}`)
      .then(({ data }) => normalizeCollections(data.collections || data))
  }

  getCollection(collectionUid) {
    return api
      .get(`/collection/${collectionUid}`)
      .then(({ data }) => normalizeCollection(data.collection || data))
      .catch(e => {
        console.error(e)
        return null
      })
  }

  getCollectionStats(collectionUid) {
    return api
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

    return api
      .get(`/assets?${stringify(params)}`)
      .then(({ data }) => {
        const result = normalizeAssets(data)
        return offset ? result.assets : result
      })
  }

  getAsset(contractAddress, tokenId, accountAddress, includeOrders = false) {
    const params = {
      include_orders: includeOrders,
      ...accountAddress && { account_address: accountAddress }
    }

    return api
      .get(`/asset/${contractAddress}/${tokenId}?${stringify(params)}`)
      .then(({ data }) => normalizeAsset(data))
  }

  getTopCollections(offset = 0) {
    console.log('Fetching top NFT collections', offset)

    const fields = [
      'fields[slug]=1',
      'fields[name]=1',
      'fields[imageUrl]=1',
      'fields[address]=1',
      'fields[addresses]=1',
      'fields[createdDate]=1',
      'fields[createdAt]=1',

      'fields[stats.floor_price]=1',
      'fields[stats.total_supply]=1',
      'fields[stats.one_day_volume]=1',
      'fields[stats.one_day_change]=1',
      'fields[stats.seven_day_volume]=1',
      'fields[stats.seven_day_change]=1',
      'fields[stats.thirty_day_volume]=1',
      'fields[stats.thirty_day_change]=1',

      'sort[stats.one_day_volume]=-1',
      'filters[trending.top_one_day]=true'
    ].join('&')

    return apiPro
      .get(`/collections?offset=${offset}&limit=50&${fields}`)
      .then(({ data }) => data.data)
  }
}

module.exports = new Opensea()
