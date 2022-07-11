const { DateTime } = require('luxon')
const opensea = require('../../providers/opensea')
const NftAsset = require('../../db/models/NftAsset')
const NftCollection = require('../../db/models/NftCollection')
const logger = require('../../config/logger')
const NftMarket = require('../../db/models/NftMarket')

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

exports.collection = async ({ params, query }, res) => {
  let collection = {}
  try {
    collection = await NftCollection.getCachedCollection(params.collection_uid)

    if (!collection) {
      collection = await opensea.getCollection(params.collection_uid)

      if (collection) {
        NftCollection.upsertCollections([collection])
      }
    }

    if (query.include_stats_chart === 'true') {
      const dateFrom = DateTime.now().minus({ days: 1 }).toSQL()
      collection.stats_chart = await NftMarket.getStatsChart(collection.uid, dateFrom)
    }
  } catch (e) {
    logger.error('Error fetching nft collection:', e)
  }

  res.send(collection)
}

exports.collectionStats = async ({ params }, res) => {

  try {
    const collection = await NftCollection.getCachedCollection(params.collection_uid)

    if (!collection) {
      const collectionStats = await opensea.getCollectionStats(params.collection_uid)
      if (collectionStats) {
        NftCollection.update(
          { stats: collectionStats, last_updated: DateTime.utc().toISO() },
          { where: { uid: params.collection_uid } }
        )
      }
      return res.send(collectionStats)
    }

    return res.send(collection.stats)
  } catch (e) {
    logger.error('Error fetching nft collection:', e)
  }
}

exports.assets = async ({ query }, res) => {
  let assets = []

  try {
    assets = await opensea.getAssets(
      query.owner,
      query.collection_uid,
      query.token_ids,
      query.contract_addresses,
      query.cursor,
      query.include_orders,
      query.order_direction,
      query.limit,
      query.offset
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

exports.events = async ({ query }, res) => {
  let events = []

  if (query.token_id && !query.asset_contract) {
    res.status(400)
    res.send({ error: 'asset_contract field is required when using token_id filter' })
  }

  try {
    events = await opensea.getEvents(
      query.event_type,
      query.account_address,
      query.collection_uid,
      query.asset_contract,
      query.token_id,
      query.occured_before,
      query.cursor
    )
  } catch (e) {
    logger.error('Error fetching nft assets:', e)
  }
  res.send(events)
}
