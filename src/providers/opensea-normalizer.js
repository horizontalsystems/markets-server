const { DateTime } = require('luxon')

exports.normalizeCollection = ({ collection }) => {
  const updatedDate = DateTime.now().toISO()

  return {
    uid: collection.slug,
    name: collection.name,
    description: collection.description,
    asset_contracts: collection.primary_asset_contracts.map(c => ({
      address: c.address,
      type: c.schema_name
    })),
    image_data: {
      image_url: collection.image_url,
      featured_image_url: collection.featured_image_url
    },
    links: {
      external_url: collection.external_url,
      discord_url: collection.discord_url,
      telegram_url: collection.telegram_url,
      twitter_username: collection.twitter_username,
      instagram_username: collection.instagram_username,
      wiki_url: collection.wiki_url
    },
    stats: collection.stats,
    last_updated: updatedDate
  }
}

exports.normalizeCollections = ({ collections }) => {
  return collections.map(collection => this.normalizeCollection({ collection }))
}

exports.normalizeAsset = asset => {
  const updatedDate = DateTime.now().toISO()
  return {
    token_id: asset.token_id,
    name: asset.name,
    description: asset.description,
    contract_address: asset.asset_contract.address,
    contract_type: asset.asset_contract.schema_name,
    symbol: asset.asset_contract.symbol,
    collection_uid: asset.collection.slug,
    image_data: {
      image_url: asset.image_url,
      image_preview_url: asset.image_preview_url
    },
    links: {
      external_url: asset.external_url,
      permalink: asset.permalink
    },
    attributes: asset.traits,
    last_sale: asset.last_sale,
    sell_orders: asset.sell_orders,
    last_updated: updatedDate
  }
}

exports.normalizeAssets = ({ assets }) => {
  return assets.map(asset => this.normalizeAsset(asset))
}
