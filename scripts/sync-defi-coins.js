require('dotenv/config')

const sequelize = require('../src/db/sequelize')
const logger = require('../src/config/logger')

const DefiCoinSyncer = require('../src/services/DefiProtocolSyncer')

async function start() {
  await sequelize.sync()
  const syncer = new DefiCoinSyncer()
  await syncer.start()
}

start().catch(e => {
  logger.error(e)
})
