const PlatformStats = require('../../db/models/PlatformStats')
const serializer = require('./platforms.serializer')
const PlatformStatsHistory = require('../../db/models/PlatformStatsHistory')

exports.index = async (req, res) => {
  const stats = await PlatformStats.getList()
  res.send(serializer.serialize(stats))
}

exports.protocols = async ({ params }, res) => {
  const platform = serializer.mapChainToPlatform(params.chain)
  const stats = await PlatformStats.getPlatforms(platform)
  res.send(serializer.serializePlatforms(stats))
}

exports.chart = async ({ params, dateFrom, dateInterval }, res) => {
  const platform = serializer.mapChainToPlatform(params.chain)
  const stats = await PlatformStatsHistory.getByPlatform(platform, dateFrom, dateInterval)
  res.send(stats)
}
