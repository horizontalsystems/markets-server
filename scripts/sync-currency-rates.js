const sequelize = require('../src/db/sequelize')
const logger = require('../src/config/logger')

const CurrencyRateSyncer = require('../src/services/CurrencyRateSyncer')

async function start() {
  await sequelize.sync()
  const syncer = new CurrencyRateSyncer()
  await syncer.start()
}

start().catch(e => {
  logger.error(e)
})
