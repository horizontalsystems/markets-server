require('dotenv/config')

const sequelize = require('../src/db/sequelize')
const AddressSyncer = require('../src/services/AddressSyncer')
const TransactionSyncer = require('../src/services/TransactionSyncer')
const DexVolumeSyncer = require('../src/services/DexVolumeSyncer')
const DexLiquiditySyncer = require('../src/services/DexLiquiditySyncer')

async function start() {
  await sequelize.sync()
  const transactionSyncer = new TransactionSyncer()
  const dexVolumeSyncer = new DexVolumeSyncer()
  const dexLiquiditySyncer = new DexLiquiditySyncer()
  const addressSyncer = new AddressSyncer()

  await Promise.all([
    transactionSyncer.start(),
    dexVolumeSyncer.start(),
    dexLiquiditySyncer.start(),
    addressSyncer.start()
  ]).catch(e => {
    console.log(e.message)
    throw e
  })
}

module.exports = start()
