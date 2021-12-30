exports.serializeList = ({ transactions, platforms }) => {
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
