const serializer = require('./etf.serializer')
const Etf = require('../../db/models/Etf')
const EtfTotalInflow = require('../../db/models/EtfTotalInflow')

exports.index = async (req, res) => {
  const etfs = await Etf.findAll()
  res.send(serializer.serializeIndex(etfs))
}

exports.total = async (req, res) => {
  const data = await EtfTotalInflow.findAll()
  res.send(serializer.serializeTotal(data))
}
