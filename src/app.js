require('dotenv/config')

const logger = require('./config/logger')
const sequelize = require('./db/sequelize')
const app = require('./config/express')

const CurrencyRateSyncer = require('./services/CurrencyRateSyncer')
const TransactionSyncer = require('./services/TransactionSyncer')
const DexVolumeSyncer = require('./services/DexVolumeSyncer')
const AddressSyncer = require('./services/AddressSyncer')
const DexLiquiditySyncer = require('./services/DexLiquiditySyncer')

async function start() {
  const transactionSyncer = new TransactionSyncer()
  const dexVolumeSyncer = new DexVolumeSyncer()
  const addressSyncer = new AddressSyncer()
  const dexLiquiditySyncer = new DexLiquiditySyncer()
  const currencyRateSyncer = new CurrencyRateSyncer()

  // Sync all defined models to the DB
  await sequelize.sync()

  // Run services & syncers
  await currencyRateSyncer.start()
  await transactionSyncer.start()
  await dexVolumeSyncer.start()
  await addressSyncer.start()
  await dexLiquiditySyncer.start()

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
