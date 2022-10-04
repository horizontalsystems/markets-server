require('dotenv/config')

const { Command } = require('commander')
const sequelize = require('../src/db/sequelize')
const CoinPriceSyncer = require('../src/services/CoinPriceSyncer')

const program = new Command()
  .option('-c --coins <coins>', 'sync market data for given coin')
  .option('-h --history <history>', 'sync historical price for given coin')
  .option('-d --defillama', 'sync coin prices from defillama')
  .parse(process.argv)

async function start({ coins, history, defillama }) {
  await sequelize.sync()
  const syncer = new CoinPriceSyncer()

  if (coins) {
    await syncer.sync(coins.split(','))
  } else if (history) {
    await syncer.syncHistory(history.split(','))
  } else {
    await syncer.start(defillama)
  }
}

module.exports = start(program.opts())
