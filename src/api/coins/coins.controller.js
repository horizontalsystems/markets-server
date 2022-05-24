const Coin = require('../../db/models/Coin')
const Platform = require('../../db/models/Platform')
const CoinMarket = require('../../db/models/CoinPrice')
const serializer = require('./coins.serializer')

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
    options.order = [Coin.literal('market_data->\'market_cap\' DESC')]
  }

  const coins = await Coin.findAll(options)

  res.send(serializer.serializeList(coins, fields, currencyRate))
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
  const pricesChart = await CoinMarket.getPriceChart(params.uid, query.interval, query.from_timestamp)
  res.send(serializer.serializePriceChart(pricesChart, currencyRate))
}

exports.price_history = async ({ params, query, currencyRate }, res) => {
  const historicalPrice = await CoinMarket.getHistoricalPrice(params.uid, parseInt(query.timestamp, 10))
  res.send(serializer.serializePriceHistory(historicalPrice, currencyRate))
}
