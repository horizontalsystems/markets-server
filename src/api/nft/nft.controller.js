const opensea = require('../../providers/opensea')
const NftAsset = require('../../db/models/NftAsset')
const NftCollection = require('../../db/models/NftCollection')
const logger = require('../../config/logger')

exports.collections = async ({ query }, res) => {
  const { limit = 100, page = 1 } = query
  const offset = query.offset ? query.offset : limit * (page - 1)
  let collections = []

  try {
    if (query.asset_owner) {
      collections = await opensea.getCollections(query.asset_owner, offset, limit)
    } else {
      collections = await NftCollection.getCollections(offset, limit)
    }
  } catch (e) {
    logger.error('Error fetching nft collection:', e)
  }

  res.send(collections)
}

exports.collection = async ({ params }, res) => {
  let collection = {}
  try {
    collection = await NftCollection.getCachedCollection(params.collection_uid)

    if (!collection) {
      collection = await opensea.getCollection(params.collection_uid)
      NftCollection.upsertCollections([collection])
    }
  } catch (e) {
    logger.error('Error fetching nft collection:', e)
  }

  res.send(collection)
}

exports.collectionStats = async ({ params }, res) => {
  let collection = {}
  try {
    collection = await NftCollection.getCachedCollection(params.collection_uid)

    if (!collection) {
      collection = await opensea.getCollection(params.collection_uid)
      NftCollection.upsertCollections([collection])
    }
  } catch (e) {
    logger.error('Error fetching nft collection:', e)
  }

  res.send(collection.stats)
}

exports.assets = async ({ query }, res) => {
  let assets = []

  try {
    assets = await opensea.getAssets(
      query.owner,
      query.token_ids,
      query.contract_addresses,
      query.collection_uid,
      query.cursor,
      query.include_orders,
      query.order_direction,
      query.limit
    )
  } catch (e) {
    logger.error('Error fetching nft assets:', e)
  }
  res.send(assets)
}

exports.asset = async ({ params, query }, res) => {
  let asset = {}
  try {
    asset = await NftAsset.getCachedAsset(params.contract_address, params.token_id)

    if (!asset) {
      asset = await opensea.getAsset(
        params.contract_address,
        params.token_id,
        query.account_address,
        query.include_orders
      )
      NftAsset.upsertAssets([asset])
    }
  } catch (e) {
    logger.error('Error fetching nft asset:', e)
  }

  res.send(asset)
}
