require('dotenv/config')

const { Command } = require('commander')
const sequelize = require('../src/db/sequelize')
const StockSyncer = require('../src/services/StockSyncer')

const program = new Command()
  .option('-f --force', 'force sync')
  .parse(process.argv)

async function start({ force }) {
  await sequelize.sync()
  const syncer = new StockSyncer()

  if (force) {
    await syncer.sync()
  } else {
    await syncer.start()
  }
}

module.exports = start(program.opts())
