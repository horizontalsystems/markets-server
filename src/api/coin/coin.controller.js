const Coin = require('../../db/models/Coin')
const serializer = require('./coin.serializer')

exports.index = async (req, res) => {
  const coins = await Coin.search(req.query.filter)
  res.status(200).json(serializer.serializeSearchResult(coins))
}

exports.prices = async (req, res) => {
  const ids = req.query.ids.split(',')
  const coins = await Coin.getPrices(ids)

  res.status(200).json(serializer.serializePrices(coins))
}

exports.show = async (req, res, next) => {
  const coin = await Coin.getByUid(req.params.id)

  if (coin) {
    res.status(200).json(serializer.serialize(coin.dataValues))
  } else {
    next()
  }
}
