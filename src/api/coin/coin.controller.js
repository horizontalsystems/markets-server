const sequelize = require('sequelize')
const Coin = require('../../db/models/Coin')
const Platform = require('../../db/models/Platform')
const serializer = require('./coin.serializer')

exports.coins = async (req, res) => {
  const coins = await Coin.findAll({
    order: [sequelize.literal(`market_data->'market_cap' DESC`)],
    limit: 100
  })

  res.send(serializer.serializeCoins(coins))
}

exports.all = async (req, res) => {
  const coins = await Coin.findAll({
    include: Platform
  })

  res.send(serializer.serializeAllList(coins))
}

exports.prices = async (req, res) => {
  const ids = req.query.ids
  const coins = await Coin.getPrices(ids)

  res.send(serializer.serializePrices(coins))
}

exports.show = async (req, res) => {
  const coin = await Coin.getCoinInfo(req.params.id)

  res.send(serializer.serializeInfo(coin))
}
