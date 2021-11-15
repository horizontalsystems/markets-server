const sequelize = require('../src/db/sequelize')
const logger = require('../src/config/logger')

const DefiCoinSyncer = require('../src/services/DefiCoinSyncer')

async function start() {
  await sequelize.sync()
  const defiCoinSyncer = new DefiCoinSyncer()

  await defiCoinSyncer.start()
}

start().catch(err => {
  logger.error(err.stack)
})
