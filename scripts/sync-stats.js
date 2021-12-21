require('dotenv/config')

const sequelize = require('../src/db/sequelize')
const AddressSyncer = require('../src/services/AddressSyncer')
const TransactionSyncer = require('../src/services/TransactionSyncer')
// const DexVolumeSyncer = require('../src/services/DexVolumeSyncer')
// const DexLiquiditySyncer = require('../src/services/DexLiquiditySyncer')

async function start() {
  await sequelize.sync()
  const addressSyncer = new AddressSyncer()
  const transactionSyncer = new TransactionSyncer()

  await addressSyncer.start()
  await transactionSyncer.start()
}

module.exports = start()
