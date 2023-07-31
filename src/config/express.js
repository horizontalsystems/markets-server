const express = require('express')
const morgan = require('morgan')
const compress = require('compression')
const methodOverride = require('method-override')
const cors = require('cors')
const helmet = require('helmet')
const middlewares = require('../api/middlewares')
const routes = require('./routes')
const logger = require('./express-logger')

// create an express application
const app = express()

// request logging. dev: console | production: file
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(logger())

// parse body params and attach them to req.body
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// gzip compression
app.use(compress())

// lets you use HTTP verbs such as PUT or DELETE
// in places where the client doesn't support it
app.use(methodOverride())

// secure apps by setting various HTTP headers
if (process.env.NODE_ENV === 'production') {
  app.use(helmet())
}

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
app.use(middlewares.error404)
app.use(middlewares.error500)

module.exports = app
