require('dotenv/config')

const { Command } = require('commander')
const SetupCoins = require('../src/services/SetupCoins')
const sequelize = require('../src/db/sequelize')

const program = new Command()
  .option('-a --all', 'setup all coins')
  .option('-f --fetch', 'fetch news coins')
  .option('-c --coins <coins>', 'setup only given coins')
  .option('-p --platform <platform>', 'force sync decimals for given platform type')
  .parse(process.argv)

async function start({ all, fetch, coins, platform }) {
  await sequelize.sync()
  const setupCoins = new SetupCoins()

  if (fetch) {
    await setupCoins.fetchCoins(200000)
  } else if (coins) {
    await setupCoins.setupCoins(coins.split(','))
  } else if (platform) {
    await setupCoins.forceSyncPlatforms(platform)
  } else if (all) {
    await setupCoins.setupCoins()
  }

  return setupCoins
}

module.exports = start(program.opts())
