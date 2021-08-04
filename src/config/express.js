const express = require('express')
const morgan = require('morgan')
const compress = require('compression')
const methodOverride = require('method-override')
const cors = require('cors')
const helmet = require('helmet')

module.exports = app => {
  // request logging. dev: console | production: file
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

  // parse body params and attache them to req.body
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  // gzip compression
  app.use(compress())

  // lets you use HTTP verbs such as PUT or DELETE
  // in places where the client doesn't support it
  app.use(methodOverride())

  // secure apps by setting various HTTP headers
  app.use(helmet())

  // enable CORS - Cross Origin Resource Sharing
  app.use(cors())
}
