const Transaction = require('../../db/models/Transaction')

exports.index = async ({ query, dateFrom, dateInterval }, res) => {
  const transactions = await Transaction.getByCoin(query.coin_uid, dateInterval, dateFrom)
  res.send(transactions)
}
