exports.serializeCoins = items => {
  return items.map(item => {
    return {
      uid: item._id,
      count: item.requestCount,
      unique: item.uniqueCount
    }
  })
}

exports.serializeResources = items => {
  return items.map(item => {
    return {
      resource: item._id,
      count: item.requestCount,
      unique: item.uniqueCount
    }
  })
}
