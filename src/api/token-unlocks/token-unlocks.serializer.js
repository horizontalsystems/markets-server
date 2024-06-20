const { nullOrString } = require('../../utils')

exports.serializeIndex = items => {
  return items.map(item => {
    return {
      uid: item.coin_uid,
      date: item.date,
      locked: nullOrString(item.locked),
      locked_percent: nullOrString(item.locked_percent),
      unlocked: nullOrString(item.unlocked),
      unlocked_percent: nullOrString(item.unlocked_percent),
      next_unlock_percent: nullOrString(item.next_unlock_percent),
      next_unlock: item.next_unlock,
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
