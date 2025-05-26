require('dotenv/config')

const { Command } = require('commander')
const sequelize = require('../src/db/sequelize')
const EtfSyncer = require('../src/services/EtfSyncer')

const program = new Command()
  .option('-f --force', 'Force sync ETF data')
  .option('-h --history', 'Sync history')
  .option('-j --json', 'Sync from json file')
  .option('-t --ticker <ticker>', 'Specify ETF to sync history')
  .parse(process.argv)

async function start({ force, ticker, history, json }) {
  await sequelize.sync()
  const etfSyncer = new EtfSyncer(json)

  if (history) {
    await etfSyncer.syncHistory()
  } else if (ticker) {
    await etfSyncer.syncHistory(ticker.split(','), force)
  } else if (force) {
    await etfSyncer.sync()
  } else {
    await etfSyncer.start()
  }
}

module.exports = start(program.opts())
