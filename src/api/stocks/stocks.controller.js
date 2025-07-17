const serializer = require('./stocks.serializer')
const Stock = require('../../db/models/Stock')
const Coin = require('../../db/models/Coin')
const { handleError } = require('../middlewares')

exports.index = async ({ currencyRate }, res) => {
  try {
    const stocks = await Stock.findAll({
      raw: true
    })

    const gold = await Coin.findOne({
      raw: true,
      where: {
        uid: 'tether-gold'
      }
    })

    res.send(serializer.serializeIndex(stocks, gold, currencyRate))
  } catch (e) {
    console.log(e)
    return handleError(res, 500, 'Internal Server Error')
  }
}
