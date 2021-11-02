const { utcDate } = require('../../utils')
const Address = require('../../db/models/Address')
const serializer = require('./addresses.serializer')

exports.index = async ({ query }, res) => {
  let dateWindow
  let dateFrom

  switch (query.interval) {
    case '1d':
      dateWindow = '1h'
      dateFrom = utcDate('yyyy-MM-dd HH:00:00', { days: -1 })
      break
    case '7d':
      dateWindow = '4h'
      dateFrom = utcDate('yyyy-MM-dd HH:00:00', { days: -7 })
      break
    default:
      dateWindow = '1d'
      dateFrom = utcDate('yyyy-MM-dd HH:00:00', { days: -30 })
      break
  }

  const addresses = await Address.getByCoinUid(query.coin_uid, dateWindow, dateFrom)

  res.send(addresses)
}

exports.holders = async ({ query }, res) => {
  const holders = await Address.getCoinHolders(query.coin_uid, query.limit)

  if (holders) {
    res.send(serializer.serializeCoinHolders(holders))
  } else {
    res.status(404).send({
      error: 'Coin not found'
    })
  }
}

exports.ranks = async ({ query }, res) => {
  const ranks = await Address.getRanks(query.coin_uid)

  if (ranks) {
    res.send(ranks)
  } else {
    res.status(404).send({
      error: 'Coin not found'
    })
  }
}
