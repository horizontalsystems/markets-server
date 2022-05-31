module.exports = {
  serialize: items => items.map(item => {
    return {
      method_id: item.method_id,
      label: item.label
    }
  })
}
