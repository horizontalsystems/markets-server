require('dotenv').config()

const logger = require('./config/logger')
const sequelize = require('./config/sequelize')

// Setup server
const app = require('./config/express')

// Sync all defined models to the DB
sequelize.sync(() => {
  // Listen to requests
  app.listen(process.env.PORT, () => {
    logger.info(`server started on port ${process.env.PORT}`)
  })
})

// Exports express
module.exports = app
