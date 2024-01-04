const Exchange = require('../../db/models/Exchange')
const serializer = require('./exchange.serializer')
const CoinMarket = require('../../db/models/CoinMarket')

exports.index = async (req, res) => {
  const exchanges = await Exchange.findAll()
  res.send(serializer.serialize(exchanges))
}

exports.tickers = async ({ query, coin }, res) => {
  const { limit = 100, page = 1 } = query
  const options = {
    where: {
      coin_id: coin.id
    },
    order: [['volume_usd', 'desc']]
  }

  if (limit) {
    options.limit = limit
    options.offset = limit * (page - 1)
  }

  const whitelist = await Exchange.getUids()
  const tickers = await CoinMarket.findAll(options)

  res.send(serializer.serializeTickers(tickers, whitelist))
}

exports.topPairs = async ({ query, currencyRate }, res) => {
  const { limit = 100, page = 1 } = query

  const markets = await CoinMarket.getTopPairs(limit, limit * (page - 1))
  res.send(serializer.serializeTopPairs(markets, currencyRate))
}

exports.whitelist = async (req, res) => {
  const exchanges = await Exchange.findAll()
  res.send(serializer.serializeWhitelist(exchanges))
}
