require('dotenv/config')

const { Command } = require('commander')
const sequelize = require('../src/db/sequelize')
const EtfSyncer = require('../src/services/EtfSyncer')

const program = new Command()
  .option('-f --force', 'Force sync ETF data')
  .option('-h --history', 'Sync history')
  .option('-c --category <category>', 'Sync ETF data for a specific category')
  .option('-j --json', 'Sync from json file')
  .option('-t --ticker <ticker>', 'Specify ETF to sync history')
  .option('--treasuries', 'Sync treasuries')
  .parse(process.argv)

async function start({ force, ticker, history, json, category, treasuries }) {
  await sequelize.sync()
  const etfSyncer = new EtfSyncer(json)

  if (category && !(category === 'btc' || category === 'eth')) {
    throw Error('Coin should be either "btc" or "eth"')
  }

  if (history) {
    await etfSyncer.syncHistory()
  } else if (ticker) {
    await etfSyncer.syncHistory(ticker.split(','))
  } else if (treasuries) {
    await etfSyncer.syncTreasuries()
  } else if (force) {
    await etfSyncer.sync(category)
  } else {
    await etfSyncer.start()
  }
}

module.exports = start(program.opts())
