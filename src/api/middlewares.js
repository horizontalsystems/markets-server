const { ValidationError } = require('express-validation')
const { utcDate } = require('../utils')
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

exports.setDateInterval = (req, res, next) => {
  let dateInterval
  let dateFrom

  switch (req.query.interval) {
    case '1d':
      dateInterval = '1h'
      dateFrom = utcDate('yyyy-MM-dd HH:00:00', { days: -1 })
      break
    case '7d':
      dateInterval = '4h'
      dateFrom = utcDate('yyyy-MM-dd HH:00:00', { days: -7 })
      break
    default:
      dateInterval = '1d'
      dateFrom = utcDate('yyyy-MM-dd HH:00:00', { days: -30 })
      break
  }

  req.dateInterval = dateInterval // eslint-disable-line
  req.dateFrom = dateFrom // eslint-disable-line

  next()
}
