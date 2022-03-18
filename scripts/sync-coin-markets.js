require('dotenv/config')

const { Command } = require('commander')
const sequelize = require('../src/db/sequelize')
const CoinMarketSyncer = require('../src/services/CoinMarketSyncer')

const program = new Command()
  .option('-c --coins <coins>', 'sync market data for given coin')
  .parse(process.argv)

async function start({ coins }) {
  await sequelize.sync()
  const syncer = new CoinMarketSyncer()

  if (coins) {
    await syncer.syncCoins(coins.split(','))
  } else {
    await syncer.start()
  }
}

module.exports = start(program.opts())
