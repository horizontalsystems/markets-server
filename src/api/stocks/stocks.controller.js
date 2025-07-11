const serializer = require('./stocks.serializer')
const Stock = require('../../db/models/Stock')
const { handleError } = require('../middlewares')

exports.index = async (req, res) => {
  try {
    const stocks = await Stock.findAll({
      raw: true
    })

    res.send(serializer.serializeIndex(stocks))
  } catch (e) {
    console.log(e)
    return handleError(res, 500, 'Internal Server Error')
  }
}
