exports.serializeKeys = keys => {
  return keys
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
