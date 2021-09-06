require('dotenv/config')

const logger = require('./config/logger')
const sequelize = require('./db/sequelize')
const app = require('./config/express')

const TransactionSyncer = require('./services/TransactionsSyncer')

async function start() {
  const transactionSyncer = new TransactionSyncer()

  // Sync all defined models to the DB
  await sequelize.sync()

  // Run services & syncers
  await transactionSyncer.start()

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
