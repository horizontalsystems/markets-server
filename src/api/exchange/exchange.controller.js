const VerifiedExchange = require('../../db/models/VerifiedExchange')
const serializer = require('./exchange.serializer')
const CoinTicker = require('../../db/models/CoinTicker')
const CoinMarket = require('../../db/models/CoinMarket')

exports.index = async (req, res) => {
  const verifiedExchanges = await VerifiedExchange.findAll()
  res.send(serializer.serialize(verifiedExchanges))
}

exports.tickers = async ({ query, coin, currencyRate }, res) => {
  const { limit = 100, page = 1 } = query
  const options = {
    where: {
      [VerifiedExchange.Op.or]: [
        { base_coin_id: coin.id },
        { target_coin_id: coin.id }
      ]
    },
    order: [['volume_usd', 'desc']]
  }

  if (limit) {
    options.limit = limit
    options.offset = limit * (page - 1)
  }

  const whitelist = await VerifiedExchange.getUids()
  const tickers = await CoinTicker.findAll(options)

  res.send(serializer.serializeTickers(tickers, whitelist, currencyRate))
}

// @deprecated
exports.topPairs = async ({ query, currencyRate }, res) => {
  const { limit = 100, page = 1 } = query

  const markets = await CoinMarket.getTopPairs(limit, limit * (page - 1))
  res.send(serializer.serializeTopPairs(markets, currencyRate))
}

exports.topMarketPairs = async ({ query, currencyRate }, res) => {
  const { limit = 100, page = 1 } = query

  const markets = await CoinTicker.getTopPairs(limit, limit * (page - 1))
  res.send(serializer.serializeTopMarketPairs(markets, currencyRate))
}

exports.whitelist = async (req, res) => {
  const verifiedExchanges = await VerifiedExchange.findAll()
  res.send(serializer.serializeWhitelist(verifiedExchanges))
}
