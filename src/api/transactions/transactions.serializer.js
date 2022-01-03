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
      date: item.date,
      count: item.count,
      volume: item.volume
    }
  })

  const platformNames = [...new Set(ids)]
    .flatMap(id => platforms.find(platform => platform.id === id))
    .map(item => item.type)

  return { platforms: platformNames, transactions: items }
}

exports.serializeDexVolumes = ({ volumes, platforms }) => {
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
      date: item.date,
      volume: item.volume
    }
  })

  const platformNames = [...new Set(ids)]
    .flatMap(id => platforms.find(platform => platform.id === id))
    .map(item => item.type)

  return { platforms: platformNames, volumes: items }
}

exports.serializeDexLiquidity = ({ liquidity, platforms }) => {
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
      date: item.date,
      volume: item.volume
    }
  })

  const platformNames = [...new Set(ids)]
    .flatMap(id => platforms.find(platform => platform.id === id))
    .map(item => item.type)

  return { platforms: platformNames, liquidity: items }
}
