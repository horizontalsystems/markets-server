require('dotenv/config')

const { Command } = require('commander')
const sequelize = require('../src/db/sequelize')
const AddressSyncer = require('../src/services/AddressSyncer')
const TransactionSyncer = require('../src/services/TransactionSyncer')
const DexVolumeSyncer = require('../src/services/DexVolumeSyncer')
const DexLiquiditySyncer = require('../src/services/DexLiquiditySyncer')

const program = new Command()
  .option('-t --tx', 'sync transactions only')
  .option('-v --volume', 'sync dex volumes only')
  .option('-l --liquidity', 'sync dex liquidity only')
  .option('-a --address', 'sync addresses only')
  .parse(process.argv)

async function start({ tx, volume, liquidity, address }) {
  await sequelize.sync()
  const transactionSyncer = new TransactionSyncer()
  const dexVolumeSyncer = new DexVolumeSyncer()
  const dexLiquiditySyncer = new DexLiquiditySyncer()
  const addressSyncer = new AddressSyncer()
  const syncers = []

  if (tx) syncers.push(transactionSyncer)
  if (address) syncers.push(addressSyncer)
  if (liquidity) syncers.push(dexLiquiditySyncer)
  if (volume) syncers.push(dexVolumeSyncer)

  if (!syncers.length) {
    syncers.push(transactionSyncer, dexVolumeSyncer, dexLiquiditySyncer, addressSyncer)
  }

  await Promise.all(syncers.map(s => s.start())).catch(e => {
    console.log(e.message)
    throw e
  })
}

module.exports = start(program.opts())
