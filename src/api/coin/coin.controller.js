const { Op } = require('sequelize');
const Coin = require('./coin.model')

exports.index = async (req, res) => {
  const { query } = req.query
  const where = {}

  if (query) {
    const condition = { [Op.iLike]: `%${query}%` }
    where[Op.or] = [{ name: condition }, { code: condition }]
  }

  const coins = await Coin.findAll({
    where
  })

  res.status(200).json(coins)
}

exports.show = async (req, res, next) => {
  const coin = await Coin.findOne({
    where: {
      id: req.params.id
    }
  })

  if (coin) {
    res.status(200).json(coin)
  } else {
    next()
  }
}

exports.create = (req, res) => {
  res.send('OK')
}

exports.upsert = (req, res) => {
  res.send('OK')
}

exports.patch = (req, res) => {
  res.send('OK')
}

exports.destroy = (req, res) => {
  res.send('OK')
}
