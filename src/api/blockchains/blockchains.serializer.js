module.exports = {
  serialize: items => {
    return items.map(item => ({
      uid: item.uid,
      name: item.name
    }))
  },
  serializeHashes: items => {
    return items.map(item => ({
      number: item.number,
      hash: item.hash
    }))
  }
}
