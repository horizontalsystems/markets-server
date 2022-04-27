const EvmMethodLabel = require('../../db/models/EvmMethodLabel')
const serializer = require('./evm-method-labels.serializer')

exports.index = async (req, res, next) => {
  try {
    const list = await EvmMethodLabel.findAll()
    res.send(serializer.serialize(list))
  } catch (e) {
    next(e)
  }
}
