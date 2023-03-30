require('dotenv/config')

const { Command } = require('commander')
const sequelize = require('../src/db/sequelize')
const CoinPriceSyncer = require('../src/services/CoinPriceSyncer')

const program = new Command()
  .option('-c --coins <coins>', 'sync given coins')
  .option('-h --history', 'sync historical data')
  .option('-a --all', 'sync all historical data')
  .option('-f --force', 'force sync data')
  .parse(process.argv)

async function start({ coins, history, force, all }) {
  await sequelize.sync()
  const syncer = new CoinPriceSyncer()
  const uids = coins ? coins.split(',') : null

  if (history) {
    return syncer.syncHistory(uids, all)
  }

  return force
    ? syncer.syncFromCoingecko(uids)
    : syncer.start()
}

module.exports = start(program.opts())
