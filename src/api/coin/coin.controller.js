const { utcDate } = require('../../utils')
const Coin = require('../../db/models/Coin')
const Platform = require('../../db/models/Platform')
const serializer = require('./coin.serializer')

exports.index = async (req, res) => {
  const coins = await Coin.findAll({
    include: Platform
  })

  res.send(serializer.serializeAll(coins, res.locals.currencyPrice))
}

exports.markets = async ({ query }, res) => {
  const {
    orderDirection = 'desc',
    orderField = 'price_change'
  } = query

  const uids = query.uids.split(',')
    .map(uid => `'${uid}'`)

  let orderBy
  if (orderField === 'price_change') {
    orderBy = 'price_change->\'24h\''
  } else {
    orderBy = `market_data->'${orderField}'`
  }

  const coins = await Coin.getMarkets(uids, orderBy, orderDirection)
  res.send(serializer.serializeMarkets(coins, res.locals.currencyPrice))
}

exports.marketsPrices = async ({ query }, res) => {
  const uids = query.uids.split(',')
    .map(uid => `'${uid}'`)

  const coins = await Coin.getMarketsPrices(uids)
  res.send(serializer.serializePrices(coins, res.locals.currencyPrice))
}

exports.topMarkets = async ({ query }, res) => {
  const {
    top = 250,
    orderDirection = 'desc',
    orderField = 'market_cap',
    limit = top
  } = query

  let orderBy
  if (orderField === 'price_change') {
    orderBy = 'price_change->\'24h\''
  } else {
    orderBy = `market_data->'${orderField}'`
  }

  const coins = await Coin.getTopMarkets(top, orderBy, orderDirection, limit)
  res.send(serializer.serializeMarkets(coins, res.locals.currencyPrice))
}

exports.show = async (req, res, next) => {
  const { language = 'en' } = req.query
  const coin = await Coin.getCoinInfo(req.params.id)

  if (coin) {
    res.send(serializer.serializeInfo(coin, language, res.locals.currencyPrice))
  } else {
    next()
  }
}

exports.transactions = async (req, res) => {
  const { id } = req.params
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

  const transactions = await Coin.getTransactions(id, window, dateFrom)

  res.send(transactions)
}

exports.addresses = async (req, res) => {
  const { id } = req.params
  const { interval } = req.query

  let window
  switch (interval) {
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

  const addresses = await Coin.getAddresses(id, window)

  res.send(addresses)
}

exports.addressHolders = async (req, res) => {
  const { id } = req.params
  const { limit } = req.query
  const coinHolders = await Coin.getCoinHolders(id, limit)

  res.send(coinHolders)
}

exports.addressRanks = async (req, res) => {
  const { id } = req.params
  const { limit } = req.query
  const addressRanks = await Coin.getAddressRanks(id, limit)

  res.send(addressRanks)
}
