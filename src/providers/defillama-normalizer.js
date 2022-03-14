const { DateTime } = require('luxon')

exports.normalizeNftCollection = collection => {
  const updatedDate = DateTime.now().minus({ hours: 1 }).toISO()

  return {
    uid: collection.slug,
    name: collection.name,
    description: collection.description,
    asset_contracts: {
      address: collection.address,
      type: ''
    },
    image_data: {
      image_url: collection.logo,
      featured_image_url: ''
    },
    links: {
      external_url: collection.website,
      discord_url: collection.discord_url,
      twitter_username: collection.twitter_username
    },
    last_updated: updatedDate
  }
}
