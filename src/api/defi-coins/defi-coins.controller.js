const Coin = require('../../db/models/Coin')
const serializer = require('./defi-coins.serializer')

exports.index = async (req, res) => {
  const coins = await Coin.getDefiCoins()
  res.send(serializer.serializeList(coins, req.currencyRate))
}
