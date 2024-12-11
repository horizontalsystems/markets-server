const Category = require('../../db/models/Category')
const serializer = require('./categories.serializer')
const coinsSerializer = require('../coins/coins.serializer')
const CategoryMarketCap = require('../../db/models/CategoryMarketCap')

exports.index = async ({ currencyRate }, res) => {
  const categories = await Category.findAll()
  res.send(serializer.serialize(categories, currencyRate))
}

exports.topCoins = async ({ currencyRate }, res) => {
  const categories = await Category.getTopCoins()
  res.send(serializer.serializeTopCoins(categories, currencyRate))
}

exports.coins = async ({ params, currencyRate }, res) => {
  const coins = await Category.getCoins(params.uid)
  const coinFields = [
    'price',
    'price_change_24h',
    'market_cap',
    'market_cap_rank',
    'total_volume'
  ]

  res.send(coinsSerializer.serializeCoins(coins, coinFields, currencyRate))
}

exports.marketCap = async ({ params, dateFrom, dateInterval, currencyRate }, res) => {
  const data = await CategoryMarketCap.getByCategory(params.uid, dateInterval, dateFrom)
  res.send(serializer.serializeMarketCap(data, currencyRate))
}
