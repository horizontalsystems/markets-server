const Category = require('../../db/models/Category')
const serializer = require('./categories.serializer')
const marketsSerializer = require('../coin/coin.serializer')

exports.index = async (req, res) => {
  const categories = await Category.findAll()
  res.send(serializer.serialize(categories))
}

exports.markets = async ({ params }, res) => {
  const markets = await Category.getTopMarkets(params.uid)
  res.send(marketsSerializer.serializeMarkets(markets))
}
