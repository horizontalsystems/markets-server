require('dotenv/config')

const { Command } = require('commander')
const sequelize = require('../src/db/sequelize')
const CoinExchangeTickerSyncer = require('../src/services/CoinTickerSyncer')

const program = new Command()
  .option('-c --coins <coins>', 'sync market data for given coin')
  .parse(process.argv)

async function start({ coins }) {
  await sequelize.sync()
  const syncer = new CoinExchangeTickerSyncer()

  if (coins) {
    await syncer.sync(coins.split(','))
  } else {
    await syncer.start()
  }
}

module.exports = start(program.opts())
