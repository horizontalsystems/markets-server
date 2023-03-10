const bitquery = require('../../providers/bitquery').bitqueryProxy
const Address = require('../../db/models/Address')
const AddressLabel = require('../../db/models/AddressLabel')
const CoinHolder = require('../../db/models/CoinHolder')
const serializer = require('./addresses.serializer')
const Platforms = require('../../db/models/Platform')

exports.index = async ({ query, dateInterval, dateFrom, dateTo }, res, next) => {
  try {
    const addresses = await Address.getByCoinUid(query.coin_uid, query.platform, dateInterval, dateFrom, dateTo)
    res.send(serializer.serializeAddresses(addresses))
  } catch (e) {
    next(e)
  }
}

exports.list = async ({ query, dateInterval, dateFrom, dateTo }, res, next) => {
  try {
    const addresses = await Address.getByCoinUid(query.coin_uid, query.platform, dateInterval, dateFrom, dateTo)
    res.send(serializer.serializeAddressList(addresses))
  } catch (e) {
    next(e)
  }
}

exports.holders = async ({ query }, res) => {
  const holders = await CoinHolder.getList(query.coin_uid, query.platform)

  if (!holders || !holders.length) {
    res.send([])
  } else {
    res.send(serializer.serializeCoinHolders(holders))
  }
}

// @deprecated
exports.coins = async ({ params, query }, res, next) => {
  const data = await bitquery.getAddressCoins(params.address, query.blockchain || query.chain)
  const values = data.balances
    .filter(item => item.value > 0 && item.currency.tokenType === 'ERC20')
    .map(item => [
      item.currency.address,
      item.value
    ])

  try {
    const balances = await Platforms.getBalances(values, query.blockchain || query.chain)
    res.send({
      block_number: data.blockNumber,
      balances: serializer.serializeBalances(balances)
    })
  } catch (e) {
    next(e)
  }
}

exports.labels = async (req, res, next) => {
  try {
    const labels = await AddressLabel.findAll()
    res.send(serializer.serializeLabels(labels))
  } catch (e) {
    next(e)
  }
}
