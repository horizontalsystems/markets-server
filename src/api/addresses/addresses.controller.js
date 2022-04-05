const bitquery = require('../../providers/bitquery').bitqueryProxy
const Address = require('../../db/models/Address')
const CoinHolder = require('../../db/models/CoinHolder')
const serializer = require('./addresses.serializer')
const Platforms = require('../../db/models/Platform')

exports.index = async ({ query, dateInterval, dateFrom }, res) => {
  const addresses = await Address.getByCoinUid(query.coin_uid, query.platform || 'erc20', dateInterval, dateFrom)

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

exports.coins = async ({ params, query }, res, next) => {
  const data = await bitquery.getAddressCoins(params.address, query.chain)
  const values = data.balances
    .filter(item => item.value > 0 && item.currency.tokenType === 'ERC20')
    .map(item => [
      item.currency.address,
      item.value
    ])

  try {
    const balances = await Platforms.getBalances(values, query.chain)
    res.send({
      block_number: data.blockNumber,
      balances
    })
  } catch (e) {
    next(e)
  }
}
