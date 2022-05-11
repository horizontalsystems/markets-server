const { floatToString, nullOrString } = require('../../utils')

module.exports = {
  serializeAddresses: ({ addresses, platforms }) => {
    if (!addresses || !platforms) {
      return {
        platforms: [],
        addresses: []
      }
    }

    const ids = []
    const items = addresses.map(item => {
      ids.push(...item.platforms)

      return {
        timestamp: item.timestamp,
        count: parseInt(item.count, 10),
      }
    })

    const platformNames = [...new Set(ids)]
      .flatMap(id => platforms.find(platform => platform.id === id))
      .map(item => item.type)

    return { platforms: platformNames, addresses: items }
  },

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
  }),

  serializeBalances: items => items.map(item => {
    return {
      value: nullOrString(item.value),
      address: item.address,
      price: nullOrString(item.price)
    }
  })
}
