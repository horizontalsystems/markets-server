const Transaction = require('../../db/models/Transaction')
const serializer = require('./transactions.serializer')

exports.index = async ({ query, dateFrom, dateInterval }, res) => {
  const transactions = await Transaction.getByCoin(query.coin_uid, query.platform, dateInterval, dateFrom)
  res.send(serializer.serializeList(transactions))
}
