const sequelize = require('../src/db/sequelize')
const logger = require('../src/config/logger')

const CoinSyncer = require('../src/services/CoinSyncer')

async function start() {
  await sequelize.sync()
  const syncer = new CoinSyncer()
  await syncer.start()
}

start().catch(e => {
  logger.error(e)
})
