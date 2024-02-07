const mongo = require('../../db/mongo')
const serializer = require('./stats.serializer')

exports.popularCoins = async (req, res) => {
  const coins = await mongo.getPopularCoins()
  res.send(serializer.serializeCoins(coins))
}

exports.popularResources = async (req, res) => {
  const coins = await mongo.getPopularResources()
  res.send(serializer.serializeResources(coins))
}
