require('dotenv/config')

const { isString } = require('lodash')
const { Command } = require('commander')
const sequelize = require('../src/db/sequelize')
const ChainlistSyncer = require('../src/services/ChainlistSyncer')

const program = new Command()
  .option('-p --platforms [platforms]', 'sync market data for given coin')
  .option('--names', 'sync chain names')
  .parse(process.argv)

async function start({ platforms, names }) {
  await sequelize.sync()
  const syncer = new ChainlistSyncer()

  if (names) {
    await syncer.syncChainNames()
  } else if (platforms) {
    await syncer.syncChains(isString(platforms) ? platforms.split(',') : null)
  } else {
    await syncer.sync()
  }
}

module.exports = start(program.opts())
