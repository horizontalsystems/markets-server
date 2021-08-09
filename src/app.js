require('dotenv').config()

const express = require('express')
const logger = require('./config/logger')
const sequelize = require('./config/sequelize')

// Setup server
const app = express()

// Configure Express & API routes
require('./config/express')(app)
require('./routes')(app)

// Sync all defined models to the DB
sequelize.sync(() => {
  // Listen to requests
  app.listen(process.env.PORT, () => {
    logger.info(`server started on port ${process.env.PORT}`)
  })
})

// Exports express
module.exports = app
