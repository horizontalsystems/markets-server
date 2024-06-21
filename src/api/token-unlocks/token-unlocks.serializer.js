const { nullOrString } = require('../../utils')

exports.serializeIndex = items => {
  return items.map(item => {
    const nextUnlock = item.next_unlock || []
    return {
      uid: item.coin_uid,
      date: item.date,
      locked: nullOrString(item.locked),
      locked_percent: nullOrString(item.locked_percent),
      unlocked: nullOrString(item.unlocked),
      unlocked_percent: nullOrString(item.unlocked_percent),
      next_unlock_percent: nullOrString(item.next_unlock_percent),
      next_unlock: nextUnlock.map(i => ({
        date: i.date,
        tokens: nullOrString(i.tokens),
        allocation_name: i.allocationName,
        allocation_tokens: nullOrString(i.allocationTokens)
      })),
    }
  })
}

exports.serializeDates = items => {
  return items.map(item => {
    return {
      uid: item.coin_uid,
      date: item.date
    }
  })
}
