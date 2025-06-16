require('dotenv/config')

const { Command } = require('commander')
const sequelize = require('../src/db/sequelize')
const VaultSyncer = require('../src/services/VaultSyncer')

const program = new Command()
  .option('-f --force', 'force sync')
  .option('-h --history', 'sync history')
  .option('--hourly', 'sync history hourly')
  .option('-a --address <address>', 'sync address')
  .parse(process.argv)

async function start({ force, address, history, hourly }) {
  await sequelize.sync()
  const syncer = new VaultSyncer()
  const addresses = address ? address.split(',') : null

  if (history) {
    await syncer.syncHistory(addresses, hourly)
  } else if (force) {
    await syncer.sync(addresses)
  } else {
    await syncer.start()
  }
}

module.exports = start(program.opts())
