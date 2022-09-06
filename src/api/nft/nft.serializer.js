const serializeList = items => items.map(({ uid, name, stats, image_data: image }) => {
  return {
    name,
    opensea_uid: uid,
    blockchain_uid: 'ethereum',
    thumbnail_url: image.large_image_url || image.image_url,
    floor_price: stats.floor_price,
    volume_1d: stats.one_day_volume,
    change_1d: stats.one_day_change,
    volume_7d: stats.seven_day_volume,
    change_7d: stats.seven_day_change,
    volume_30d: stats.thirty_day_volume,
    change_30d: stats.thirty_day_change,
  }
})

exports.serialize = (data, simplified) => {
  if (!simplified) {
    return data
  }

  return {
    one_day: serializeList(data.one_day),
    seven_day: serializeList(data.seven_day),
    thirty_day: serializeList(data.thirty_day)
  }
}

exports.serializeList = serializeList
