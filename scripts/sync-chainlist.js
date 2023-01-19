require('dotenv/config')

const { Command } = require('commander')
const sequelize = require('../src/db/sequelize')
const ChainlistSyncer = require('../src/services/ChainlistSyncer')

const program = new Command()
  .option('-c --coins <coins>', 'sync market data for given coin')
  .parse(process.argv)

async function start() {
  await sequelize.sync()
  const syncer = new ChainlistSyncer()
  await syncer.sync()
}

module.exports = start(program.opts())
