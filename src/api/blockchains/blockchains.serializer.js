module.exports = {
  serialize: items => {
    return items.map(item => ({
      uid: item.uid,
      name: item.name,
      url: item.url
    }))
  },
  serializeHashes: items => {
    return items.map(item => ({
      number: item.number,
      hash: item.hash
    }))
  }
}
