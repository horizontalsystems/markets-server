require('dotenv/config')

const { Command } = require('commander')
const sequelize = require('../src/db/sequelize')
const CoinStatsSyncer = require('../src/services/CoinStatsSyncer')

const program = new Command()
  .option('-c --coins <coins>', 'sync market data for given coin')
  .option('-i --ignore <coins>', 'ignore given coins from sync')
  .option('-k --keep', 'keep price and volume history')
  .parse(process.argv)

async function start({ coins, ignore, keep }) {
  await sequelize.sync()
  const syncer = new CoinStatsSyncer()
  const ignoreUids = ignore ? ignore.split(',') : null

  if (coins) {
    await syncer.syncCoins(coins.split(','), keep, ignoreUids)
  } else {
    await syncer.start(keep, ignoreUids)
  }
}

module.exports = start(program.opts())
