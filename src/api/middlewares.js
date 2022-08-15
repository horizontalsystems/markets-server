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
      dateFrom = utcDate({ days: -1 })
      break
    case '7d': // @deprecated use 1w instead
    case '1w':
      dateInterval = '4h'
      dateFrom = utcDate({ days: -7 })
      break
    case '2w':
      dateInterval = '8h'
      dateFrom = utcDate({ days: -14 }, 'yyyy-MM-dd')
      break
    case '30d': // @deprecated use 1m instead
    case '1m':
      dateFrom = utcDate({ month: -1 }, 'yyyy-MM-dd')
      break
    case '3m':
      dateFrom = utcDate({ month: -3 }, 'yyyy-MM-dd')
      break
    case '6m':
      dateFrom = utcDate({ month: -6 }, 'yyyy-MM-dd')
      break
    case '1y':
      dateFrom = utcDate({ month: -12 }, 'yyyy-MM-dd')
      break
    default:
      dateInterval = '30m'
      dateFrom = utcDate({ days: -1 })
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
  console.log(err)

  if (err instanceof ValidationError) {
    res.status(err.statusCode)
    res.json(err)
    return
  }

  res.status(500)

  if (process.env.NODE_ENV === 'development') {
    res.json(err)
  } else {
    res.json({ message: 'Interval Server error' })
  }
}
