require('dotenv/config')

const sequelize = require('../src/db/sequelize')
const logger = require('../src/config/logger')

const GlobalMarketsSyncer = require('../src/services/GlobalMarketsSyncer')

async function start() {
  await sequelize.sync()
  const globalMarketsSyncer = new GlobalMarketsSyncer()
  await globalMarketsSyncer.start()
}

start().catch(e => {
  logger.error(e)
})
