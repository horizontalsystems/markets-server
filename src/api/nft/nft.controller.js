const opensea = require('../../providers/opensea')
const NftAsset = require('../../db/models/NftAsset')
const NftCollection = require('../../db/models/NftCollection')

exports.collections = async ({ query }, res) => {
  const collections = await opensea.getCollections(query.asset_owner, query.offset, query.limit)
  NftCollection.upsertCollections(collections)
  res.send(collections)
}

exports.collection = async ({ params }, res) => {
  let collection = await NftCollection.getCachedCollection(params.collection_uid)

  if (!collection) {
    collection = await opensea.getCollection(params.collection_uid)
    NftCollection.upsertCollections([collection])
  }

  res.send(collection)
}

exports.assets = async ({ query }, res) => {
  const assets = await opensea.getAssets(
    query.owner,
    query.token_ids,
    query.contract_addresses,
    query.collection,
    query.order_direction,
    query.offset,
    query.limit
  )

  NftAsset.upsertAssets(assets)
  res.send(assets)
}

exports.asset = async ({ params, query }, res) => {
  let asset = await NftAsset.getCachedAsset(params.contract_address, params.token_id)

  if (!asset) {
    asset = await opensea.getAsset(params.contract_address, params.token_id, query.account_address)
    NftAsset.upsertAssets([asset])
  }

  res.send(asset)
}
