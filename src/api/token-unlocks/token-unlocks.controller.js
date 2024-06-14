const serializer = require('./token-unlocks.serializer')
const TokenUnlock = require('../../db/models/TokenUnlock')

exports.index = async (req, res) => {
  const unlocks = await TokenUnlock.findAll()
  res.send(serializer.serializeIndex(unlocks))
}
