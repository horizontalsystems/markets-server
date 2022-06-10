const Platform = require('../../db/models/Platform')
const serializer = require('./platforms.serializer')

exports.list = async (req, res) => {
  const list = await Platform.getListCoins()
  res.send(serializer.serialize(list))
}
