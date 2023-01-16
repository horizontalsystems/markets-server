require('dotenv/config')

const { Command } = require('commander')
const sequelize = require('../src/db/sequelize')
const CoinPriceSyncer = require('../src/services/CoinPriceSyncer')

const program = new Command()
  .option('-c --coins <coins>', 'sync given coins')
  .option('-d --defillama', 'change sync source to defillama')
  .option('-h --history', 'sync historical data')
  .option('-f --force', 'force sync data')
  .parse(process.argv)

async function start({ coins, history, defillama, force }) {
  await sequelize.sync()
  const syncer = new CoinPriceSyncer()
  const uids = coins ? coins.split(',') : null

  if (history) {
    return syncer.syncHistory(uids)
  }

  if (defillama) {
    return force
      ? syncer.syncFromDefillama(uids)
      : syncer.sync(defillama)
  }

  return force
    ? syncer.syncFromCoingecko(uids)
    : syncer.start()
}

module.exports = start(program.opts())
