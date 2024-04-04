exports.serializeKeys = ({ keys }) => {
  return keys.map(item => {
    return item
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
