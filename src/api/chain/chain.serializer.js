module.exports = {
  serializeHashes: items => {
    return items.map(item => ({
      number: item.number,
      hash: item.hash
    }))
  },
}
