const express = require('express')
const coin = require('../api/coin')
const language = require('../api/language')
const category = require('../api/category')
const error = require('./middlewares/error')

module.exports = app => {
  app.use('/docs', express.static('docs'))

  app.use('/coins', coin)
  app.use('/languages', language)
  app.use('/categories', category)

  // if error is not an instanceOf APIError, convert it.
  app.use(error.converter)

  // catch 404 and forward to error handler
  app.use(error.notFound)

  // error handler, send stacktrace only during development
  app.use(error.handler)
}
