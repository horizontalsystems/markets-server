const sequelize = require('../src/db/sequelize')
const logger = require('../src/config/logger')

const CoinSyncer = require('../src/services/CoinSyncer')
const DefiCoinSyncer = require('../src/services/DefiCoinSyncer')

async function start() {
  await sequelize.sync()
  const coinSyncer = new CoinSyncer()
  const defiCoinSyncer = new DefiCoinSyncer()

  await coinSyncer.start()
  await defiCoinSyncer.start()
}

start().catch(err => {
  logger.error(err.stack)
})
