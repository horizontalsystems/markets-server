require('dotenv/config')

const { Command } = require('commander')
const sequelize = require('../src/db/sequelize')
const CoinStatsSyncer = require('../src/services/CoinStatsSyncer')

const program = new Command()
  .option('-c --coins <coins>', 'sync market data for given coin')
  .option('-k --keep', 'keep price and volume history')
  .parse(process.argv)

async function start({ coins, keep }) {
  await sequelize.sync()
  const syncer = new CoinStatsSyncer()

  if (coins) {
    await syncer.syncCoins(coins.split(','), keep)
  } else {
    await syncer.start(keep)
  }
}

module.exports = start(program.opts())
