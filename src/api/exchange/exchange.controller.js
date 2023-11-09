const Exchange = require('../../db/models/Exchange')
const serializer = require('./exchange.serializer')

exports.index = async (req, res) => {
  const exchanges = await Exchange.findAll()
  res.send(serializer.serialize(exchanges))
}
