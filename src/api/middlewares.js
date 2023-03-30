const { ValidationError } = require('express-validation')
const { utcDate, utcStartOfDay } = require('../utils')
const CurrencyRate = require('../db/models/CurrencyRate')
const Coin = require('../db/models/Coin')

const dateInterval = (interval, minInterval) => {
  switch (interval) {
    case '1d':
      return {
        dateInterval: minInterval,
        dateFrom: utcDate({ days: -1 }),
        dateFromTimestamp: utcDate({ days: -1 }, null, true),
        dateTo: utcDate({})
      }
    case '1w':
      return {
        dateInterval: '4h',
        dateFrom: utcDate({ days: -7 }),
        dateFromTimestamp: utcDate({ days: -7 }, null, true),
        dateTo: utcStartOfDay({})
      }
    case '2w':
      return {
        dateInterval: '8h',
        dateFrom: utcDate({ days: -14 }, 'yyyy-MM-dd'),
        dateFromTimestamp: utcDate({ days: -14 }, null, true),
        dateTo: utcStartOfDay({})
      }
    case '1m':
      return {
        dateInterval: '1d',
        dateFrom: utcDate({ month: -1 }, 'yyyy-MM-dd'),
        dateFromTimestamp: utcDate({ month: -1 }, null, true),
        dateTo: utcStartOfDay({})
      }
    case '3m':
      return {
        dateInterval: '1d',
        dateFrom: utcDate({ month: -3 }, 'yyyy-MM-dd'),
        dateFromTimestamp: utcDate({ month: -3 }, null, true),
        dateTo: utcStartOfDay({})
      }
    case '6m':
      return {
        dateInterval: '1d',
        dateFrom: utcDate({ month: -6 }, 'yyyy-MM-dd'),
        dateFromTimestamp: utcDate({ month: -6 }, null, true),
        dateTo: utcStartOfDay({})
      }
    case '1y':
      return {
        dateInterval: '1d',
        dateFrom: utcDate({ month: -12 }, 'yyyy-MM-dd'),
        dateFromTimestamp: utcDate({ month: -12 }, true, null),
        dateTo: utcStartOfDay({})
      }
    case '2y':
      return {
        dateInterval: '1w',
        dateFrom: utcDate({ month: -24 }, 'yyyy-MM-dd'),
        dateFromTimestamp: utcDate({ month: -24 }, null, true),
        dateTo: utcStartOfDay({})
      }
    case 'all':
      return {
        dateInterval: '1d',
        dateFrom: utcDate({ years: -10 }, 'yyyy-MM-dd'),
        dateFromTimestamp: utcDate({ years: -10 }, null, true),
        dateTo: utcStartOfDay({})
      }
    default:
      return {
        dateInterval: minInterval,
        dateFrom: utcDate({ days: -1 }),
        dateFromTimestamp: utcDate({ days: -1 }, null, true),
        dateTo: utcDate({})
      }
  }
}

const dailyInterval = interval => {
  const daysToSecs = days => (days * 24 * 60 * 60)

  switch (interval) {
    case '1w':
      return {
        dateInterval: '1d',
        dateFrom: utcDate({ seconds: daysToSecs(-7) }, 'yyyy-MM-dd'),
        dateFromTimestamp: utcDate({ seconds: daysToSecs(-7) }, null, true),
        dateTo: utcStartOfDay({})
      }
    case '2w':
      return {
        dateInterval: '1d',
        dateFrom: utcDate({ seconds: daysToSecs(-14) }, 'yyyy-MM-dd'),
        dateFromTimestamp: utcDate({ seconds: daysToSecs(-14) }, null, true),
        dateTo: utcStartOfDay({})
      }
    case '1m':
      return {
        dateInterval: '1d',
        dateFrom: utcDate({ seconds: daysToSecs(-30) }, 'yyyy-MM-dd'),
        dateFromTimestamp: utcDate({ seconds: daysToSecs(-30) }, null, true),
        dateTo: utcStartOfDay({})
      }
    case '3m':
      return {
        dateInterval: '1d',
        dateFrom: utcDate({ seconds: daysToSecs(-90) }, 'yyyy-MM-dd'),
        dateFromTimestamp: utcDate({ seconds: daysToSecs(-90) }, null, true),
        dateTo: utcStartOfDay({})
      }
    case '6m':
      return {
        dateInterval: '1d',
        dateFrom: utcDate({ seconds: daysToSecs(-180) }, 'yyyy-MM-dd'),
        dateFromTimestamp: utcDate({ seconds: daysToSecs(-180) }, null, true),
        dateTo: utcStartOfDay({})
      }
    case '1y':
      return {
        dateInterval: '1d',
        dateFrom: utcDate({ seconds: daysToSecs(-365) }, 'yyyy-MM-dd'),
        dateFromTimestamp: utcDate({ seconds: daysToSecs(-365) }, true, true),
        dateTo: utcStartOfDay({})
      }
    case '2y':
      return {
        dateInterval: '1w',
        dateFrom: utcDate({ seconds: daysToSecs(-730) }, 'yyyy-MM-dd'),
        dateFromTimestamp: utcDate({ seconds: daysToSecs(-730) }, null, true),
        dateTo: utcStartOfDay({})
      }
    case 'all':
      return {
        dateInterval: '1d',
        dateFrom: utcDate({ years: -10 }, 'yyyy-MM-dd'),
        dateFromTimestamp: utcDate({ years: -10 }, null, true),
        dateTo: utcStartOfDay({})
      }
    default:
      return {
        dateInterval: '1d',
        dateFrom: utcDate({ seconds: daysToSecs(-30) }, 'yyyy-MM-dd'),
        dateFromTimestamp: utcDate({ seconds: daysToSecs(-30) }, null, true),
        dateTo: utcStartOfDay({})
      }
  }
}

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
  const dateParams = dateInterval(req.query.interval, '30m')

  req.dateInterval = dateParams.dateInterval // eslint-disable-line
  req.dateFrom = dateParams.dateFrom // eslint-disable-line

  next()
}

exports.requireCoin = async (req, res, next) => {
  const coin = await Coin.getPlatforms(req.params.uid)
  if (!coin) {
    return res.status(404).send({ error: 'Coin not found' })
  }

  req.coin = coin // eslint-disable-line

  next()
}

exports.setDexDateInterval = (req, res, next) => {
  const dateParams = dateInterval(req.query.interval, '1h')

  req.dateInterval = dateParams.dateInterval // eslint-disable-line
  req.dateFrom = dateParams.dateFrom // eslint-disable-line
  req.dateFromTimestamp = dateParams.dateFromTimestamp // eslint-disable-line
  req.dateTo = dateParams.dateTo // eslint-disable-line

  next()
}

exports.setDailyInterval = (req, res, next) => {
  const dateParams = dailyInterval(req.query.interval)

  req.dateInterval = dateParams.dateInterval // eslint-disable-line
  req.dateFrom = dateParams.dateFrom // eslint-disable-line
  req.dateFromTimestamp = dateParams.dateFromTimestamp // eslint-disable-line
  req.dateTo = dateParams.dateTo // eslint-disable-line

  next()
}

exports.setMonthlyInterval = (req, res, next) => {
  const dateParams = dateInterval('1m', '1d')

  req.dateInterval = dateParams.dateInterval // eslint-disable-line
  req.dateFrom = dateParams.dateFrom // eslint-disable-line
  req.dateFromTimestamp = dateParams.dateFromTimestamp // eslint-disable-line
  req.dateTo = dateParams.dateTo // eslint-disable-line

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
