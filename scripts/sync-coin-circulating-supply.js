require('dotenv/config')

const { Command } = require('commander')
const sequelize = require('../src/db/sequelize')
const CoinCirculatingSupplySyncer = require('../src/services/CoinCirculatingSupplySyncer')

const program = new Command()
  .option('-c --coins <coins>', 'sync market data for given coins')
  .parse(process.argv)

async function start({ coins }) {
  await sequelize.sync()
  const syncer = new CoinCirculatingSupplySyncer()

  if (coins) {
    await syncer.sync(coins.split(','))
  } else {
    await syncer.sync()
  }
}

module.exports = start(program.opts())