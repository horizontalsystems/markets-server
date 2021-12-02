const serializer = require('./funds.serializer')
const Treasury = require('../../db/models/Treasury')
const FundsInvested = require('../../db/models/FundsInvested')

exports.treasuries = async ({ query, currencyRate }, res) => {
  const treasuries = await Treasury.getByCoin(query.coin_uid)
  res.send(serializer.serializeTreasuries(treasuries, currencyRate))
}

exports.investments = async ({ query }, res) => {
  const investments = await FundsInvested.getByCoin(query.coin_uid)
  res.send(serializer.serializeFundsInvested(investments))
}
