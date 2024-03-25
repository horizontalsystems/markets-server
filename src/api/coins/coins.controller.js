const Coin = require('../../db/models/Coin')
const Platform = require('../../db/models/Platform')
const CoinStats = require('../../db/models/CoinStats')
const CoinPrice = require('../../db/models/CoinPrice')
const serializer = require('./coins.serializer')
const Exchange = require('../../db/models/Exchange')
const CoinMarket = require('../../db/models/CoinMarket')
const CoinIndicator = require('../../db/models/CoinIndicator')

exports.index = async ({ query, currencyRate }, res) => {
  const { limit = 1500, page = 1 } = query
  const options = {
    where: {},
    order: ['id']
  }

  let fields = []
  if (query.fields) {
    fields = query.fields.split(',').slice(0, 100)
  }
  if (fields.includes('platforms') || fields.includes('all_platforms')) {
    options.include = Platform
  }
  if (limit) {
    options.limit = limit
    options.offset = limit * (page - 1)
  }
  if (query.uids) {
    options.where.uid = query.uids.split(',')
  }
  if (query.defi === 'true') {
    options.where.is_defi = true
  }
  if (query.order_by_rank === 'true') {
    options.where.coingecko_id = Coin.literal('coingecko_id IS NOT NULL')
    options.order = [Coin.literal('market_data->\'market_cap\' DESC')]
  }

  const coins = await Coin.findAll(options)

  res.send(serializer.serializeCoins(coins, fields, currencyRate))
}

exports.filter = async ({ query, currencyRate }, res) => {
  const { limit = 1500, page = 1 } = query
  const options = {
    where: {},
    order: ['id'],
    include: [CoinMarket, CoinStats, CoinIndicator]
  }

  if (limit) {
    options.limit = limit
    options.offset = limit * (page - 1)
  }

  if (query.order_by_rank === 'true') {
    options.where.coingecko_id = Coin.literal('coingecko_id IS NOT NULL')
    options.order = [Coin.literal('market_data->\'market_cap\' DESC')]
  }

  const exchanges = await Exchange.getUids()
  const coins = await Coin.findAll(options)

  res.send(serializer.serializeFilter(coins, currencyRate, exchanges))
}

exports.list = async ({ currencyRate }, res, next) => {
  try {
    const coins = await Coin.getList()
    res.send(serializer.serializeList(coins, currencyRate))
  } catch (e) {
    next(e)
  }
}

exports.show = async ({ params, query, currencyRate }, res) => {
  const coin = await Coin.getCoinInfo(params.uid)

  if (coin) {
    res.send(serializer.serializeShow(coin, query.language, currencyRate))
  } else {
    res.status(404)
    res.send({ error: 'Coin not found' })
  }
}

exports.details = async (req, res) => {
  const coin = await Coin.getCoinDetails(req.params.uid)

  if (coin) {
    res.send(serializer.serializeDetails(coin, req.currencyRate))
  } else {
    res.status(404)
    res.send({ error: 'Coin not found' })
  }
}

exports.movers = async (req, res, next) => {
  try {
    const movers = await Coin.getTopMovers()
    res.send(serializer.serializeMovers(movers, req.currencyRate))
  } catch (e) {
    next(e)
  }
}

exports.moversBy = async ({ params, query, currencyRate }, res, next) => {
  try {
    const uids = query.uids ? query.uids.split(',') : null
    const data = await Coin.getTopMoversBy(params.field, uids, query.order, query.limit)
    res.send(serializer.serializeGainers(data, currencyRate))
  } catch (e) {
    next(e)
  }
}

exports.twitter = async ({ params }, res) => {
  const [coin] = await Coin.query('SELECT links->\'twitter\' as twitter FROM coins WHERE uid = :uid', {
    uid: params.uid
  })

  if (coin) {
    res.send(serializer.serializeTwitter(coin))
  } else {
    res.status(404)
    res.send({ error: 'Coin not found' })
  }
}

exports.price_chart = async ({ params, query, currencyRate }, res) => {
  let { interval } = query
  if (!interval && !query.from_timestamp) {
    interval = '1w'
  }

  const pricesChart = await CoinPrice.getPriceChart(params.uid, interval, parseInt(query.from_timestamp, 10))
  res.send(serializer.serializePriceChart(pricesChart, currencyRate))
}

exports.price_chart_start = async ({ params }, res) => {
  const coinPrice = await CoinPrice.getFirstCoinPrice(params.uid)
  res.send(serializer.serializeFirstCoinPrice(coinPrice))
}

exports.price_history = async ({ params, query, currencyRate }, res) => {
  const price = await CoinPrice.getHistoricalPrice(params.uid, parseInt(query.timestamp, 10))
  if (price) {
    res.send(serializer.serializePriceHistory(price, currencyRate))
  } else {
    res.status(404)
  }
}
