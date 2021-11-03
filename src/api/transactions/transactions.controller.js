const { utcDate } = require('../../utils')
const Transaction = require('../../db/models/Transaction')

exports.index = async ({ query }, res) => {
  let window
  let dateFrom

  switch (query.interval) {
    case '1d':
      window = '1h'
      dateFrom = utcDate('yyyy-MM-dd HH:00:00', { days: -1 })
      break
    case '7d':
      window = '4h'
      dateFrom = utcDate('yyyy-MM-dd HH:00:00', { days: -7 })
      break
    default:
      window = '1d'
      dateFrom = utcDate('yyyy-MM-dd HH:00:00', { days: -30 })
      break
  }

  const transactions = await Transaction.getByCoin(query.coin_uid, window, dateFrom)
  res.send(transactions)
}
