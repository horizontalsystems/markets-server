const serializer = require('./token-unlocks.serializer')
const TokenUnlock = require('../../db/models/TokenUnlock')

exports.index = async (req, res) => {
  const unlocks = await TokenUnlock.query('select * from token_unlocks where date >= NOW() order by date asc')
  res.send(serializer.serializeIndex(unlocks))
}

exports.dates = async ({ query }, res) => {
  const uids = query.uids.split(',')
  const unlocks = await TokenUnlock.query(
    'select coin_uid, date from token_unlocks where date >= NOW() and coin_uid in (:uids) order by date asc',
    { uids }
  )

  res.send(serializer.serializeDates(unlocks))
}
