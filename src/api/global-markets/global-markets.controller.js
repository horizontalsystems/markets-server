const { capitalizeFirstLetter, utcDate } = require('../../utils')
const { serializeList, serializeTvls, serializeOverview } = require('./global-markets.serializer')

const Chain = require('../../db/models/Chain')
const Category = require('../../db/models/Category')
const GlobalMarket = require('../../db/models/GlobalMarket')
const NftCollection = require('../../db/models/NftCollection')

exports.index = async (req, res) => {
  const markets = await GlobalMarket.getList(req.dateFrom, req.dateInterval)

  res.status(200)
  res.json(serializeList(markets, req.currencyRate))
}

exports.overview = async ({ currencyRate, query }, res, next) => {
  try {
    const dateFrom = utcDate({ hours: -24 })
    const nft = await NftCollection.getTopMovers()
    const global = await GlobalMarket.getList(dateFrom, '30m')
    const categories = await Category.getTopMovers(['blockchains', 'stablecoins', 'exchange_tokens', 'dexes', 'lending'])
    const platforms = await Chain.getList(5)

    res.status(200)
    res.json(serializeOverview({ global, categories, nft, platforms, simplified: query.simplified }, currencyRate))
  } catch (e) {
    next(e)
  }
}

exports.tvls = async ({ query, dateFrom, dateInterval, currencyRate }, res) => {
  const tvls = await GlobalMarket.getTvls(capitalizeFirstLetter(query.blockchain || query.chain), dateFrom, dateInterval)

  res.status(200)
  res.json(serializeTvls(tvls, currencyRate))
}
