const { floatToString } = require('../../utils')

module.exports = {
  serializeCoinHolders: coinHolders => {
    return coinHolders.map((item) => ({
      address: item.address,
      share: floatToString(parseFloat(item.percentage))
    }))
  },

  serializeLabels: items => items.map(item => {
    return {
      address: item.address,
      label: item.label
    }
  })
}
