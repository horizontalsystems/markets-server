const Transaction = require('../../db/models/Transaction')
const DexLiquidity = require('../../db/models/DexLiquidity')
const DexVolume = require('../../db/models/DexVolume')
const serializer = require('./transactions.serializer')
const { utcDate } = require('../../utils')

exports.index = async ({ query, dateFrom, dateTo, dateInterval }, res) => {
  const transactions = await Transaction.getByCoin(query.coin_uid, query.platform, dateInterval, dateFrom, dateTo)
  res.send(serializer.serializeTransactions(transactions))
}

exports.dexVolume = async ({ query, dateFrom, dateTo, dateInterval, currencyRate }, res) => {
  const dexVolume = await DexVolume.getByCoin(query.coin_uid, query.platform, dateInterval, dateFrom, dateTo)
  res.send(serializer.serializeDexVolumes(dexVolume, currencyRate))
}

exports.dexLiquidity = async ({ query, dateFrom, dateTo, dateInterval, currencyRate }, res) => {
  const showAll = (dateInterval === '1d' || dateInterval === '1w')
  const date = showAll ? dateTo : utcDate({})

  const dexLiquidity = await DexLiquidity.getByCoin(query.coin_uid, query.platform, dateInterval, dateFrom, date, showAll)
  res.send(serializer.serializeDexLiquidity(dexLiquidity, currencyRate))
}
