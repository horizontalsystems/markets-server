require('dotenv/config')

const { Command } = require('commander')
const CoinMarketsSyncer = require('../src/services/CoinMarketsSyncer')
const sequelize = require('../src/db/sequelize')

const program = new Command()
  .option('-a --all', 'sync hisorical price for all coins')
  .option('-f --fetch', 'fetch not synced coins')
  .option('-c --coins <coins>', 'sync historical price for only given setup')
  .parse(process.argv)

async function start({ all, fetch, coins }) {
  await sequelize.sync()
  const syncer = new CoinMarketsSyncer()

  if (fetch) {
    await syncer.fetchNotSyncedCoins()
  } else if (coins) {
    await syncer.syncHistorical(coins)
  } else if (all) {
    await syncer.start()
  }

  return syncer
}

module.exports = start(program.opts())
