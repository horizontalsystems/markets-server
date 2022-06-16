const Chain = require('../../db/models/Chain')
const serializer = require('./top-chains.serializer')
const ChainMarketCap = require('../../db/models/ChainMarketCap')

exports.index = async ({ currencyRate }, res) => {
  const stats = await Chain.getList()
  res.send(serializer.serialize(stats, currencyRate))
}

exports.protocols = async ({ params, currencyRate }, res) => {
  const stats = await Chain.getPlatforms(params.chain)
  res.send(serializer.serializePlatforms(stats, currencyRate))
}

exports.chart = async ({ params, dateFrom, dateInterval, currencyRate }, res) => {
  const stats = await ChainMarketCap.getByPlatform(params.chain, dateFrom, dateInterval)
  res.send(serializer.serializeChart(stats, currencyRate))
}
