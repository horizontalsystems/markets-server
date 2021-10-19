const Category = require('../../db/models/Category')
const serializer = require('./categories.serializer')
const coinsSerializer = require('../coins/coins.serializer')

exports.index = async (req, res) => {
  const categories = await Category.findAll()
  res.send(serializer.serialize(categories))
}

exports.coins = async ({ params, currencyRate }, res) => {
  const coins = await Category.getCoins(params.uid)
  const coinFields = [
    'price',
    'change_24h',
    'market_cap',
    'total_volume'
  ]

  res.send(coinsSerializer.serializeList(coins, coinFields, currencyRate))
}
