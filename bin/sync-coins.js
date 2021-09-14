const sequelize = require('../src/db/sequelize')
const logger = require('../src/config/logger')

const CoinSyncer = require('../src/services/CoinSyncer')

async function start() {
  await sequelize.sync()
  const coinSyncer = new CoinSyncer()

  coinSyncer.start()
}

start().catch(err => {
  logger.error(err.stack)
})
