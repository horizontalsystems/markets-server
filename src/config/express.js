const express = require('express')
const morgan = require('morgan')
const compress = require('compression')
const methodOverride = require('method-override')
const cors = require('cors')
const helmet = require('helmet')
const { ValidationError } = require('express-validation')
const routes = require('./routes')

// create an express application
const app = express()

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

// mount STATUS route
app.use('/status', (req, res) => {
  res.send({
    code: 200,
    status: 'ok'
  })
})

// mount API v1 routes
app.use('/v1', routes)

// catch 404 and forward to error handler
app.use((req, res) => {
  return res.status(404).send({
    error: 'Not found'
  })
})

// error handler
app.use((err, req, res, next) => {
  if (err instanceof ValidationError) {
    res.status(err.statusCode)
  } else {
    res.status(500)
  }
  res.json(err)
})

module.exports = app
