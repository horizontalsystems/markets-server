require('dotenv').config()

const express = require('express')
const logger = require('./config/logger')

// Setup server
const app = express()

// Configure Express & API routes
require('./config/express')(app)
require('./routes')(app)

// Listen to requests
app.listen(process.env.PORT, () => {
  logger.info(`server started on port ${process.env.PORT}`)
})

// Exports express
module.exports = app
