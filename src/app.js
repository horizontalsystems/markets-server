require('dotenv/config')

const logger = require('./config/logger')
const sequelize = require('./db/sequelize')
const app = require('./config/express')

async function start() {
  await sequelize.sync()

  // Listen to requests
  app.listen(process.env.PORT, () => {
    logger.info(`server started on port ${process.env.PORT}`)
  })
}

start().catch(err => {
  logger.error(err.stack)
})

// Exports express
module.exports = app
