require('dotenv/config')

const { Command } = require('commander')
const sequelize = require('../src/db/sequelize')
const CoinVolumeSyncer = require('../src/services/CoinVolumeSyncer')

const program = new Command()
  .option('-c --coins <coins>', 'sync given coins')
  .option('-h --history', 'sync historical data')
  .option('-a --all', 'sync all historical data')
  .parse(process.argv)

async function start({ coins, history, all }) {
  await sequelize.sync()
  const syncer = new CoinVolumeSyncer()
  const uids = coins ? coins.split(',') : null

  if (coins && history) {
    return syncer.syncHistory(uids, all)
  }

  return coins
    ? syncer.sync(uids)
    : syncer.start()
}

module.exports = start(program.opts())
