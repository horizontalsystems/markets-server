const Exchange = require('../../db/models/Exchange')
const serializer = require('./exchange.serializer')
const CoinMarket = require('../../db/models/CoinMarket')

exports.index = async (req, res) => {
  const exchanges = await Exchange.findAll()
  res.send(serializer.serialize(exchanges))
}

exports.tickers = async (req, res) => {
  const tickers = await CoinMarket.findAll({
    where: {
      coin_id: req.coin.id
    }
  })

  res.send(serializer.serializeTickers(tickers))
}

exports.whitelist = async (req, res) => {
  const exchanges = await Exchange.findAll()
  res.send(serializer.serializeWhitelist(exchanges))
}
