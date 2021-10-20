const { utcDate } = require('../../utils')
const Coin = require('../../db/models/Coin')
const Platform = require('../../db/models/Platform')
const Treasury = require('../../db/models/Treasury')
const serializer = require('./coins.serializer')

exports.index = async ({ query, currencyRate }, res) => {
  const options = {
    where: {},
    order: [Coin.literal('market_data->\'market_cap\' DESC')]
  }

  let fields = []
  if (query.fields) {
    fields = query.fields.split(',')
  }
  if (fields.includes('platforms')) {
    options.include = Platform
  }
  if (query.limit) {
    options.limit = query.limit
  }
  if (query.uids) {
    options.where.uid = query.uids.split(',')
  }

  const coins = await Coin.findAll(options)

  res.send(serializer.serializeList(coins, fields, currencyRate))
}

exports.show = async (req, res) => {
  const { language = 'en' } = req.query
  const coin = await Coin.getCoinInfo(req.params.uid)

  if (coin) {
    res.send(serializer.serializeShow(coin, language, req.currencyRate))
  } else {
    res.status(404).send({
      error: 'Coin not found'
    })
  }
}

exports.details = async (req, res) => {
  const coin = await Coin.getCoinDetails(req.params.uid)

  if (coin) {
    res.send(serializer.serializeDetails(coin, req.currencyRate))
  } else {
    res.status(404).send({
      error: 'Coin not found'
    })
  }
}

exports.treasuries = async ({ params, currencyRate }, res) => {
  const treasuries = await Treasury.getByCoin(params.uid)
  res.send(serializer.serializeTreasuries(treasuries, currencyRate))
}

exports.transactions = async (req, res) => {
  const { uid } = req.params
  const { interval } = req.query

  let window
  let dateFrom

  switch (interval) {
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

  const transactions = await Coin.getTransactions(uid, window, dateFrom)

  res.send(transactions)
}

exports.addresses = async ({ params, query }, res) => {
  let window
  switch (query.interval) {
    case '1d':
      window = '1h'
      break
    case '7d':
      window = '4h'
      break
    default:
      window = '1d'
      break
  }

  const addresses = await Coin.getAddresses(params.uid, window)

  res.send(addresses)
}

exports.addressHolders = async ({ params, query }, res) => {
  const coinHolders = await Coin.getCoinHolders(params.uid, query.limit)

  res.send(coinHolders)
}

exports.addressRanks = async ({ params, query }, res) => {
  const addressRanks = await Coin.getAddressRanks(params.uid, query.limit)

  res.send(addressRanks)
}
