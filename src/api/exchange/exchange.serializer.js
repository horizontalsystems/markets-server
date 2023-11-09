exports.serialize = exchanges => {
  return exchanges.map(item => {
    return {
      uid: item.uid,
      name: item.name
    }
  })
}
