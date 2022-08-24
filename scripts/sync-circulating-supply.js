require('dotenv/config')

const { Command } = require('commander')
const sequelize = require('../src/db/sequelize')
const CoinCirculatingSupplySyncer = require('../src/services/CoinCirculatingSupplySyncer')

const program = new Command()
  .option('-c --coins <coins>', 'sync market data for given coins')
  .option('--chain <chain>', 'sync market data for given chain')
  .parse(process.argv)

async function start({ coins, chain }) {
  await sequelize.sync()
  const syncer = new CoinCirculatingSupplySyncer()

  if (coins) {
    return syncer.sync({ uids: coins.split(',') })
  }
  if (chain) {
    return syncer.sync({ chain })
  }
  return syncer.sync()
}

module.exports = start(program.opts())
