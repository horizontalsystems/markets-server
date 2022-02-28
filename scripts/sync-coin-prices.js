require('dotenv/config')

const { Command } = require('commander')
const CoinPriceSyncer = require('../src/services/CoinPriceSyncer')
const sequelize = require('../src/db/sequelize')

const program = new Command()
  .option('-c --coins <coins>', 'sync historical price for only given setup')
  .parse(process.argv)

async function start({ coins }) {
  await sequelize.sync()
  const syncer = new CoinPriceSyncer()

  if (coins) {
    await syncer.syncHistoricalList(coins)
  } else {
    await syncer.start()
  }

  return syncer
}

module.exports = start(program.opts())
