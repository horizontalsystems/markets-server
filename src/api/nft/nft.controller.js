const { DateTime } = require('luxon')
const opensea = require('../../providers/opensea')
const NftAsset = require('../../db/models/NftAsset')
const NftCollection = require('../../db/models/NftCollection')
const NftMarket = require('../../db/models/NftMarket')
const { serializeList } = require('./nft.serializer')
const { utcDate } = require('../../utils')

exports.collections = async ({ query }, res) => {
  const { limit = 100, page = 1 } = query
  const offset = query.offset ? query.offset : limit * (page - 1)

  if (query.simplified) {
    return NftCollection.getCollections(offset, limit)
      .then(data => {
        res.send(serializeList(data))
      })
      .catch(e => {
        console.log('Error getting nft collections:', e.message, (e.parent || {}).message)
        res.send([])
      })
  }

  let collections = []
  try {
    if (query.asset_owner) {
      collections = await opensea.getCollections(query.asset_owner, offset, limit)
    } else {
      collections = await NftCollection.getCollections(offset, limit)
    }
  } catch (e) {
    console.log('Error fetching nft collection:', e.message, (e.parent || {}).message)
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
    console.log('Error fetching nft collection:', e.message, (e.parent || {}).message)
  }

  res.send(collection)
}

exports.collectionChart = async ({ params }, res) => {
  let chart = []
  try {
    chart = await NftMarket.getStatsChart(params.collection_uid, utcDate({ hours: -24 }))
  } catch (e) {
    console.log('Error fetching nft collection:', e.message, (e.parent || {}).message)
  }

  res.send(chart)
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
    console.log('Error fetching nft collection:', e.message, (e.parent || {}).message)
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
    console.log('Error fetching nft assets:', e.message, (e.parent || {}).message)
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
    console.log('Error fetching nft asset:', e.message, (e.parent || {}).message)
  }

  res.send(asset)
}

exports.events = async ({ query: { simplified, ...query } }, res) => {
  if (simplified) {
    return opensea.proxyEvents(query)
      .then(({ data }) => {
        res.send(data)
      })
      .catch(({ message, response = {} }) => {
        res.status(response.status || 500)
        res.send({ error: message || 'Internal server error' })
      })
  }

  if (query.token_id && !query.asset_contract) {
    res.status(400)
    res.send({ error: 'asset_contract field is required when using token_id filter' })
  }

  let events = []
  try {
    events = await opensea.getEvents(
      query.event_type,
      query.account_address,
      query.collection_uid,
      query.asset_contract,
      query.token_id,
      query.occured_before,
      query.cursor,
      query.simplified
    )
  } catch (e) {
    console.log('Error fetching nft assets:', e.message, (e.parent || {}).message)
  }
  res.send(events)
}
