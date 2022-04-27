module.exports = {
  serialize: items => items.map(item => {
    return {
      method_id: item.methodId,
      label: item.label
    }
  })
}
