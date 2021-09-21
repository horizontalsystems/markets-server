const Coin = require('../../db/models/Coin')
const serializer = require('./coin.serializer')

exports.coins = async (req, res) => {
  const coins = await Coin.getByRank(100)
  res.status(200).json(serializer.serializeCoins(coins))
}

exports.all = async (req, res) => {
  const coins = await Coin.findAll()
  res.status(200).json(serializer.serializeAllList(coins))
}

exports.prices = async (req, res) => {
  const ids = req.query.ids
  const coins = await Coin.getPrices(ids)

  res.status(200).json(serializer.serializePrices(coins))
}

exports.show = async (req, res, next) => {
  const coin = await Coin.getCoinInfo(req.params.id)

  if (coin) {
    res.status(200).json(serializer.serializeInfo(coin))
  } else {
    next()
  }
}
