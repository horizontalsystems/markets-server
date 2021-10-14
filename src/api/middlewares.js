const { ValidationError } = require('express-validation')
const CurrencyPrice = require('../db/models/CurrencyPrice')

exports.setCurrencyRate = async (req, res, next) => {

  // eslint-disable-next-line no-param-reassign
  req.currencyRate = await CurrencyPrice.getCurrencyRate(req.query.currency)

  if (!req.currencyRate) {
    const errors = [{
      currency: 'Wrong currency code'
    }]

    return next(new ValidationError(errors, { statusCode: 400, error: 'Bad Request' }))
  }

  next()
}
