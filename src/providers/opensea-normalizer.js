const { DateTime } = require('luxon')

exports.normalizeCollection = collection => {
  const updatedDate = DateTime.now().toISO()

  return {
    uid: collection.slug,
    name: collection.name,
    description: collection.description,
    asset_contracts: collection.primary_asset_contracts ? collection.primary_asset_contracts.map(c => ({
      address: c.address,
      type: c.schema_name
    })) : [],
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

exports.normalizeCollections = collections => {
  return collections.map(collection => this.normalizeCollection(collection))
}

exports.normalizeAsset = asset => {
  const updatedDate = DateTime.now().toISO()
  return {
    token_id: asset.token_id,
    name: asset.name,
    symbol: asset.asset_contract.symbol,
    contract: {
      address: asset.asset_contract.address,
      type: asset.asset_contract.schema_name,
    },
    collection_uid: asset.collection.slug,
    description: asset.description,
    image_data: {
      image_url: asset.image_url,
      image_preview_url: asset.image_preview_url
    },
    links: {
      external_link: asset.asset_contract.external_link,
      permalink: asset.permalink
    },
    attributes: asset.traits,
    markets_data: {
      last_sale: asset.last_sale,
      orders: asset.orders,
      sell_orders: asset.sell_orders
    },
    last_updated: updatedDate
  }
}

exports.normalizeAssets = ({ next, previous, assets }) => {
  return {
    cursor: {
      next,
      previous
    },
    assets: assets.map(asset => this.normalizeAsset(asset))
  }
}

exports.normalizeEvents = ({ next, previous, asset_events: events }) => {
  return {
    cursor: {
      next,
      previous
    },
    events: events.map(event => this.normalizeEvent(event))
  }
}

// "approved_account": null,
// "asset_bundle": null,
// "auction_type": "min_price",
// "bid_amount": null,
// "collection_slug": "cryptopunks",
// "contract_address": "0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb",
// "created_date": "2022-03-17T13:36:47.195285",
// "custom_event_name": null,
// "dev_fee_payment_event": null,
// "dev_seller_fee_basis_points": null,
// "duration": null,
// "ending_price": "73950000000000000000",
// "event_type": "created",
// "from_account": null,
// "id": 4201204175,
// "is_private": null,
// "owner_account": null,
// "payment_token": {
//     "symbol": "ETH",
//     "address": "0x0000000000000000000000000000000000000000",
//     "image_url": "https://storage.opensea.io/files/6f8e2979d428180222796ff4a33ab929.svg",
//     "name": "Ether",
//     "decimals": 18,
//     "eth_price": "1.000000000000000",
//     "usd_price": "2778.510000000000218000"
// },
// "quantity": "1",
// "seller": null,
// "starting_price": "73950000000000000000",
// "to_account": null,
// "total_price": null,
// "transaction": {
//     "block_hash": "0xfac61efd1619a09aae7be859df79108f9fd41ac502a1644805b34d34ffc29cac",
//     "block_number": "14404332",
//     "from_account": {
//         "user": null,
//         "profile_img_url": "https://storage.googleapis.com/opensea-static/opensea-profile/11.png",
//         "address": "0x1919db36ca2fa2e15f9000fd9cdc2edcf863e685",
//         "config": ""
//     },
//     "id": 302796091,
//     "timestamp": "2022-03-17T13:36:31",
//     "to_account": {
//         "user": null,
//         "profile_img_url": "https://storage.googleapis.com/opensea-static/opensea-profile/23.png",
//         "address": "0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb",
//         "config": ""
//     },
//     "transaction_hash": "0x08a17686adf238947e2ac758ec15539b562b41684da6ea62c6a210fa5673dca1",
//     "transaction_index": "57"
// },
// "winner_account": null,
// "listing_time": null

exports.normalizeEvent = event => {

  let eventType
  let eventAmount = 0

  switch (event.event_type) {
    case 'successful':
      eventType = 'sale'
      eventAmount = event.total_price
      break
    case 'created':
      eventType = 'list'
      eventAmount = event.ending_price
      break
    case 'offer_entered':
    case 'bid_entered':
      eventType = 'bid'
      eventAmount = event.bid_amount
      break
    case 'bid_withdrawn':
      eventType = 'bid_cancel'
      eventAmount = event.bid_amount
      break
    case 'transfer':
      eventType = 'transfer'
      break
    case 'cancel':
      eventType = 'cancel'
      break
    default:
      eventType = event.event_type
  }

  return {
    asset: this.normalizeAsset(event.asset),
    date: event.created_date,
    type: eventType,
    amount: eventAmount,
    quantity: event.quantity,
    transaction: event.transaction,
  }
}
