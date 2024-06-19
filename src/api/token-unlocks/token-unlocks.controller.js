const serializer = require('./token-unlocks.serializer')
const TokenUnlock = require('../../db/models/TokenUnlock')

exports.index = async (req, res) => {
  const unlocks = await TokenUnlock.query('select * from token_unlocks where date >= NOW() order by date asc')
  res.send(serializer.serializeIndex(unlocks))
}
