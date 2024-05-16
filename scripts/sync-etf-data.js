require('dotenv/config')

const { Command } = require('commander')
const sequelize = require('../src/db/sequelize')
const EtfSyncer = require('../src/services/EtfSyncer')

const program = new Command()
  .option('-f --force', 'Force sync ETF data')
  .parse(process.argv)

async function start({ force }) {
  await sequelize.sync()
  const etfSyncer = new EtfSyncer()

  if (force) {
    await etfSyncer.sync()
  } else {
    await etfSyncer.start()
  }
}

module.exports = start(program.opts())
