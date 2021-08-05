require('dotenv').config()

const express = require('express')
const logger = require('./config/logger')
const db = require('./config/db')

// Setup server
const app = express()

// Configure Express & API routes
require('./config/express')(app)
require('./routes')(app)

db.sequelize.sync({ force: false })
  .then(() => {
    // Listen to requests
    app.listen(process.env.PORT, () => {
      logger.info(`server started on port ${process.env.PORT}`)
    })
  })

// Exports express
module.exports = app
