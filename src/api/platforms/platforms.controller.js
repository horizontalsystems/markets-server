const Chain = require('../../db/models/Chain')
const serializer = require('./platforms.serializer')
const ChainMarketCap = require('../../db/models/ChainMarketCap')

exports.index = async (req, res) => {
  const stats = await Chain.getList()
  res.send(serializer.serialize(stats))
}

exports.protocols = async ({ params }, res) => {
  const stats = await Chain.getPlatforms(params.chain)
  res.send(serializer.serializePlatforms(stats))
}

exports.chart = async ({ params, dateFrom, dateInterval }, res) => {
  const stats = await ChainMarketCap.getByPlatform(params.chain, dateFrom, dateInterval)
  res.send(serializer.serializeChart(stats))
}
