const sequelize = require('../src/db/sequelize')
const logger = require('../src/config/logger')

const GlobalMarketsSyncer = require('../src/services/GlobalMarketsSyncer')
const AddressSyncer = require('../src/services/AddressSyncer')
// const TransactionSyncer = require('../src/services/TransactionSyncer')
// const DexVolumeSyncer = require('../src/services/DexVolumeSyncer')
// const DexLiquiditySyncer = require('../src/services/DexLiquiditySyncer')

async function start() {
  await sequelize.sync()
  const globalMarketsSyncer = new GlobalMarketsSyncer()
  const addressSyncer = new AddressSyncer()

  await globalMarketsSyncer.start()
  await addressSyncer.start()
}

start().catch(e => {
  logger.error(e)
})
