const Address = require('../../db/models/Address')
const CoinHolder = require('../../db/models/CoinHolder')
const serializer = require('./addresses.serializer')

exports.index = async ({ query, dateInterval, dateFrom }, res) => {
  const addresses = await Address.getByCoinUid(query.coin_uid, dateInterval, dateFrom)

  res.send(addresses)
}

exports.holders = async ({ query }, res) => {
  const holders = await CoinHolder.getList(query.coin_uid, query.platform)

  if (!holders || !holders.length) {
    res.status(404).send({
      error: 'Coin not found'
    })
  } else {
    res.send(serializer.serializeCoinHolders(holders))
  }
}
