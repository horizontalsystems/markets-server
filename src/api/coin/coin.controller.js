const Coin = require('./coin.model')
const Language = require('../language/language.model')
const coinGeckoProvider = require('../../providers/coin-gecko-provider')
const serializer = require('./coin.serializer')

exports.index = async (req, res) => {
  const coins = await Coin.search(req.query.filter)
  res.status(200).json(coins)
}

exports.show = async (req, res, next) => {
  const coin = await Coin.getById(req.params.id)
  const coinInfo = await coinGeckoProvider.getCoinInfo(req.params.id)
  const languages = await Language.findAll()

  if (coin && coinInfo) {
    res.status(200).json(serializer.serialize(coin, coinInfo, languages))
  } else {
    next()
  }
}

exports.create = (req, res) => {
  res.send('OK')
}

exports.upsert = (req, res) => {
  res.send('OK')
}

exports.patch = (req, res) => {
  res.send('OK')
}

exports.destroy = (req, res) => {
  res.send('OK')
}
