const { utcDate, capitalizeFirstLetter } = require('../../utils')
const { serializeList, serializeTvls } = require('./global-markets.serializer')
const GlobalMarket = require('../../db/models/GlobalMarket')

exports.index = async ({ query, currencyRate }, res) => {
  let window
  let dateFrom

  switch (query.interval) {
    case '1d':
      window = '1h'
      dateFrom = utcDate('yyyy-MM-dd HH:00:00', { days: -1 })
      break
    case '7d':
      window = '4h'
      dateFrom = utcDate('yyyy-MM-dd HH:00:00', { days: -7 })
      break
    default:
      window = '1d'
      dateFrom = utcDate('yyyy-MM-dd HH:00:00', { days: -30 })
      break
  }

  const markets = await GlobalMarket.getList(dateFrom, window)

  res.status(200)
  res.json(serializeList(markets, currencyRate))
}

exports.tvls = async ({ params, query, currencyRate }, res) => {
  let window
  let dateFrom

  switch (query.interval) {
    case '1d':
      window = '1h'
      dateFrom = utcDate('yyyy-MM-dd HH:00:00', { days: -1 })
      break
    case '7d':
      window = '4h'
      dateFrom = utcDate('yyyy-MM-dd HH:00:00', { days: -7 })
      break
    default:
      window = '1d'
      dateFrom = utcDate('yyyy-MM-dd HH:00:00', { days: -30 })
      break
  }

  const tvls = await GlobalMarket.getTvls(capitalizeFirstLetter(params.chain), dateFrom, window)

  res.status(200)
  res.json(serializeTvls(tvls, currencyRate))
}
