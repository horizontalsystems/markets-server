require('dotenv/config')

const { Command } = require('commander')
const sequelize = require('../src/db/sequelize')
const CoinCategorySyncer = require('../src/services/CoinCategorySyncer')

const program = new Command()
  .option('-c --coins <coins>', 'sync categories for the given coins')
  .parse(process.argv)

async function start({ coins }) {
  await sequelize.sync()
  const coinCategorySyncer = new CoinCategorySyncer()

  if (coins) {
    await coinCategorySyncer.sync(coins.split(','))
  } else {
    await coinCategorySyncer.start()
  }
}

module.exports = start(program.opts())
