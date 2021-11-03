const Coin = require('../../db/models/Coin')
const Platform = require('../../db/models/Platform')
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

exports.twitter = async ({ params }, res) => {
  const [coin] = await Coin.query('SELECT links->\'twitter\' as twitter FROM coins WHERE uid = :uid', {
    uid: params.uid
  })

  if (coin) {
    res.send(coin)
  } else {
    res.status(404).send({
      error: 'Coin not found'
    })
  }
}
