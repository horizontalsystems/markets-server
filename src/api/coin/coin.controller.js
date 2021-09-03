const Coin = require('../../db/models/Coin')
const serializer = require('./coin.serializer')
const marketInfoProvider = require('../../providers/market-info-provider');

exports.index = async (req, res) => {
  const coins = await Coin.search(req.query.filter)
  res.status(200).json(serializer.serializeSearchResult(coins))
}

exports.show = async (req, res, next) => {
  const coin = await Coin.getByUid(req.params.id)
  const { language, currency } = req.query
  const coinInfo = await marketInfoProvider.getCoinInfo(req.params.id, language, currency)

  if (coin && coinInfo) {
    res.status(200).json(serializer.serialize(coin, coinInfo, language))
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
