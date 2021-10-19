const { ValidationError } = require('express-validation')
const CurrencyRate = require('../db/models/CurrencyRate')

exports.setCurrencyRate = async (req, res, next) => {

  // eslint-disable-next-line no-param-reassign
  req.currencyRate = await CurrencyRate.getCurrencyRate(req.query.currency)

  if (!req.currencyRate) {
    const errors = [{
      currency: 'Wrong currency code'
    }]

    return next(new ValidationError(errors, { statusCode: 400, error: 'Bad Request' }))
  }

  next()
}
