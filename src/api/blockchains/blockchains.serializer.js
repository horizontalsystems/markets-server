module.exports = {
  serialize: items => {
    return items.map(item => ({
      uid: item.uid,
      name: item.name
    }))
  }
}
