const { sequelize } = require('../../db/sequelize')
const Coin = require('../../db/models/Coin')
const Platform = require('../../db/models/Platform')
const serializer = require('./coin.serializer')

exports.coins = async (req, res) => {
  const { top = 250, orderField = 'market_cap', orderDirection = 'DESC', limit } = req.query // todo: validate params
  const orderBy = orderField === 'price_change'
    ? 'price_change->\'24h\''
    : `market_data->'${orderField}'`

  const coins = await sequelize.query(`
    with top_coins as (
      SELECT * FROM coins
      ORDER BY market_data->'market_cap' DESC
      LIMIT ${top}
    )
    SELECT * FROM top_coins
    ORDER BY ${orderBy} ${orderDirection}
    LIMIT ${limit || top}
  `, { type: sequelize.QueryTypes.SELECT })

  res.send(serializer.serializeCoins(coins))
}

exports.all = async (req, res) => {
  const coins = await Coin.findAll({
    include: Platform
  })

  res.send(serializer.serializeAllList(coins))
}

exports.prices = async (req, res) => {
  const coins = await Coin.getPrices(req.query.ids)

  res.send(serializer.serializePrices(coins))
}

exports.show = async (req, res) => {
  const coin = await Coin.getCoinInfo(req.params.id)

  res.send(serializer.serializeInfo(coin))
}
