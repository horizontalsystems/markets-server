require('dotenv/config')

const logger = require('./config/logger')
const sequelize = require('./db/sequelize')
const app = require('./config/express')

const CurrencyPriceSyncer = require('./services/CurrencyPriceSyncer')
const TransactionSyncer = require('./services/TransactionSyncer')
const AddressSyncer = require('./services/AddressSyncer')

async function start() {
  const transactionSyncer = new TransactionSyncer()
  const addressSyncer = new AddressSyncer()
  const currencyPriceSyncer = new CurrencyPriceSyncer()

  // Sync all defined models to the DB
  await sequelize.sync()

  // Run services & syncers
  await currencyPriceSyncer.start()
  await transactionSyncer.start()
  await addressSyncer.start()

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
