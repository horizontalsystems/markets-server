const mongo = require('../../db/mongo')
const serializer = require('./stats.serializer')

exports.popularCoins = async (req, res) => {
  const coins = await mongo.getStats('coin_stats')
  res.send(serializer.serializeCoins(coins))
}

exports.popularResources = async (req, res) => {
  const resources = await mongo.getStats('resource_stats')
  res.send(serializer.serializeResources(resources))
}
