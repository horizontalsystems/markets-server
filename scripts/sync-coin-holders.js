require('dotenv/config')

const { Command } = require('commander')
const sequelize = require('../src/db/sequelize')
const CoinHolderSyncer = require('../src/services/CoinHolderSyncer')

const program = new Command()
  .option('-c --coins <coins>', 'sync holders for given coins')
  .parse(process.argv)

async function start({ coins }) {
  await sequelize.sync()
  const coinHolderSyncer = new CoinHolderSyncer()

  if (coins) {
    await coinHolderSyncer.sync(coins.split(','))
  } else {
    await coinHolderSyncer.start()
  }
}

module.exports = start(program.opts())
