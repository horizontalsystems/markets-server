const { ValidationError } = require('express-validation')
const { utcDate } = require('../utils')
const CurrencyRate = require('../db/models/CurrencyRate')

exports.setCurrencyRate = async (req, res, next) => {

  const record = await CurrencyRate.getCurrencyRate(req.query.currency, req.query.timestamp)
  if (!record || !record.rate) {
    const errors = [{
      currency: 'Wrong currency code'
    }]

    return next(new ValidationError(errors, { statusCode: 400, error: 'Bad Request' }))
  }

  // eslint-disable-next-line no-param-reassign
  req.currencyRate = record.rate

  next()
}

exports.setDateInterval = (req, res, next) => {
  let dateInterval = '1d'
  let dateFrom

  switch (req.query.interval) {
    case '1d':
      dateInterval = '30m'
      dateFrom = utcDate('yyyy-MM-dd HH:00:00', { days: -1 })
      break
    case '1w':
      dateInterval = '4h'
      dateFrom = utcDate('yyyy-MM-dd HH:00:00', { days: -7 })
      break
    case '2w':
      dateInterval = '8h'
      dateFrom = utcDate('yyyy-MM-dd', { days: -14 })
      break
    case '1m':
      dateFrom = utcDate('yyyy-MM-dd', { month: -1 })
      break
    case '3m':
      dateFrom = utcDate('yyyy-MM-dd', { month: -3 })
      break
    case '6m':
      dateFrom = utcDate('yyyy-MM-dd', { month: -6 })
      break
    case '1y':
      dateFrom = utcDate('yyyy-MM-dd', { month: -12 })
      break
    default:
      dateInterval = '30m'
      dateFrom = utcDate('yyyy-MM-dd HH:00:00', { days: -1 })
  }

  req.dateInterval = dateInterval // eslint-disable-line
  req.dateFrom = dateFrom // eslint-disable-line

  next()
}

exports.error404 = (req, res) => {
  res.status(404)
  res.send({
    error: 'Not found'
  })
}

exports.error500 = (err, req, res, next) => {
  if (err instanceof ValidationError) {
    res.status(err.statusCode)
  } else {
    res.status(500)
  }

  res.json(err)
}
