const Address = require('../../db/models/Address')
const serializer = require('./addresses.serializer')

exports.index = async ({ query, dateInterval, dateFrom }, res) => {
  const addresses = await Address.getByCoinUid(query.coin_uid, dateInterval, dateFrom)

  res.send(addresses)
}

exports.holders = async ({ query }, res) => {
  const holders = await Address.getCoinHolders(query.coin_uid, query.platform, query.limit)

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
