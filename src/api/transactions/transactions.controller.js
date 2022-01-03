const Transaction = require('../../db/models/Transaction')
const DexLiquidity = require('../../db/models/DexLiquidity')
const DexVolume = require('../../db/models/DexVolume')
const serializer = require('./transactions.serializer')

exports.index = async ({ query, dateFrom, dateInterval }, res) => {
  const transactions = await Transaction.getByCoin(query.coin_uid, query.platform, dateInterval, dateFrom)
  res.send(serializer.serializeTransactions(transactions))
}

exports.dexVolume = async ({ query, dateFrom, dateInterval }, res) => {
  const dexVolume = await DexVolume.getByCoin(query.coin_uid, query.platform, dateInterval, dateFrom)
  res.send(serializer.serializeDexVolumes(dexVolume))
}

exports.dexLiquidity = async ({ query, dateFrom, dateInterval }, res) => {
  const dexLiquidity = await DexLiquidity.getByCoin(query.coin_uid, query.platform, dateInterval, dateFrom)
  res.send(serializer.serializeDexLiquidity(dexLiquidity))
}
