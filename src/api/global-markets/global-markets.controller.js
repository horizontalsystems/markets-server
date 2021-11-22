const { capitalizeFirstLetter } = require('../../utils')
const { serializeList, serializeTvls } = require('./global-markets.serializer')
const GlobalMarket = require('../../db/models/GlobalMarket')

exports.index = async (req, res) => {
  const markets = await GlobalMarket.getList(req.dateFrom, req.dateInterval)

  res.status(200)
  res.json(serializeList(markets, req.currencyRate))
}

exports.tvls = async (req, res) => {
  const tvls = await GlobalMarket.getTvls(capitalizeFirstLetter(req.query.chain), req.dateFrom, req.dateInterval)

  res.status(200)
  res.json(serializeTvls(tvls, req.currencyRate))
}
