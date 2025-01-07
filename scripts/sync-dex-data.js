require('dotenv/config')

const { Command } = require('commander')
const sequelize = require('../src/db/sequelize')
const AddressSyncer = require('../src/services/AddressSyncer')
const TransactionSyncer = require('../src/services/TransactionSyncer')
const DexVolumeSyncer = require('../src/services/DexVolumeSyncer')
const DexLiquiditySyncer = require('../src/services/DexLiquiditySyncer')
const DefiyieldSyncer = require('../src/services/DefiyieldSyncer')
const AuditSyncer = require('../src/services/AuditSyncer')

const program = new Command()
  .option('-t --tx', 'sync transactions only')
  .option('-v --volume', 'sync dex volumes only')
  .option('-l --liquidity', 'sync dex liquidity only')
  .option('-a --address', 'sync addresses only')
  .option('-d --defiyield', 'sync defiyield data only')
  .option('-c --coins <coins>', 'sync historical data for the given coins')
  .option('-s --source <source>', 'sync historical data for the given coins')
  .option('-p --print <chain>', 'just print information')
  .option('--audit', 'sync audits')
  .parse(process.argv)

async function start({ tx, volume, liquidity, address, coins, source, print, defiyield, audit }) {
  await sequelize.sync()
  const transactionSyncer = new TransactionSyncer()
  const dexVolumeSyncer = new DexVolumeSyncer()
  const defiyieldSyncer = new DefiyieldSyncer()
  const auditSyncer = new AuditSyncer()
  const dexLiquiditySyncer = new DexLiquiditySyncer()
  const addressSyncer = new AddressSyncer()
  const syncers = []

  if (tx) syncers.push(transactionSyncer)
  if (address) syncers.push(addressSyncer)
  if (liquidity) syncers.push(dexLiquiditySyncer)
  if (volume) syncers.push(dexVolumeSyncer)
  if (defiyield) syncers.push(defiyieldSyncer)
  if (audit) syncers.push(auditSyncer)

  if (!syncers.length) {
    syncers.push(transactionSyncer, dexVolumeSyncer, dexLiquiditySyncer, addressSyncer, defiyieldSyncer, auditSyncer)
  }

  const mapper = s => {
    if (print) {
      return s.showPlatforms(print)
    }

    if (coins) {
      return s.syncHistorical(coins.split(','), source)
    }

    return s.start()
  }

  await Promise.all(syncers.map(mapper)).catch(e => {
    throw e
  })
}

module.exports = start(program.opts())
