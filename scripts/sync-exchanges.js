require('dotenv/config')

const { Command } = require('commander')
const sequelize = require('../src/db/sequelize')
const ExchangeSyncer = require('../src/services/ExchangeSyncer')

const program = new Command()
  .option('-f --full', 'full sync')
  .parse(process.argv)

async function start({ full }) {
  await sequelize.sync()
  const syncer = new ExchangeSyncer()

  if (full) {
    await syncer.syncFull()
  } else {
    await syncer.start()
  }
}

module.exports = start(program.opts())
