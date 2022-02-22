const Category = require('../../db/models/Category')
const serializer = require('./categories.serializer')
const coinsSerializer = require('../coins/coins.serializer')
const CategoryMarketCap = require('../../db/models/CategoryMarketCap')

exports.index = async (req, res) => {
  const categories = await Category.findAll()
  res.send(serializer.serialize(categories))
}

exports.coins = async ({ params, currencyRate }, res) => {
  const coins = await Category.getCoins(params.uid)
  const coinFields = [
    'price',
    'price_change_24h',
    'market_cap',
    'total_volume'
  ]

  res.send(coinsSerializer.serializeList(coins, coinFields, currencyRate))
}

exports.marketCap = async ({ params, dateFrom, dateInterval }, res) => {
  const data = await CategoryMarketCap.getByCategory(params.uid, dateInterval, dateFrom)
  res.send(data)
}
