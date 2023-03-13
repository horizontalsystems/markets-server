const { nullOrString, valueInCurrency } = require('../../utils')

exports.serializeTransactions = ({ transactions, platforms }) => {
  if (!transactions || !platforms) {
    return {
      platforms: [],
      transactions: []
    }
  }

  const ids = []
  const items = transactions.map(item => {
    ids.push(...item.platforms)

    return {
      timestamp: item.date,
      count: parseInt(item.count, 10),
      volume: nullOrString(item.volume)
    }
  })

  const platformNames = [...new Set(ids)]
    .flatMap(id => platforms.find(platform => platform.id === id))
    .map(item => item.chain_uid)

  return { platforms: platformNames, transactions: items }
}

exports.serializeDexVolumes = ({ volumes, platforms }, rate) => {
  if (!volumes || !platforms) {
    return {
      platforms: [],
      volumes: []
    }
  }

  const ids = []
  const items = volumes.map(item => {
    ids.push(...item.platforms)

    return {
      timestamp: item.date,
      volume: valueInCurrency(item.volume, rate)
    }
  })

  const platformNames = [...new Set(ids)]
    .flatMap(id => platforms.find(platform => platform.id === id))
    .map(item => item.chain_uid)

  return { platforms: platformNames, volumes: items }
}

exports.serializeDexLiquidity = ({ liquidity, platforms }, rate) => {
  if (!liquidity || !platforms) {
    return {
      platforms: [],
      liquidity: []
    }
  }

  const ids = []
  const items = liquidity.map(item => {
    ids.push(...item.platforms)

    return {
      timestamp: item.date,
      volume: valueInCurrency(item.volume, rate)
    }
  })

  const platformNames = [...new Set(ids)]
    .flatMap(id => platforms.find(platform => platform.id === id))
    .map(item => item.chain_uid)

  return { platforms: platformNames, liquidity: items }
}
