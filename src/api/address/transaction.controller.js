const Address = require('../../db/models/Address')

exports.index = async (req, res) => {
  const address = await Address.findAll()
  res.status(200).json(address)
}
