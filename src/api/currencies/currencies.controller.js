const Currency = require('../../db/models/Currency')

exports.index = async (req, res) => {
  const currencies = await Currency.findAll()
  res.send(currencies)
}
