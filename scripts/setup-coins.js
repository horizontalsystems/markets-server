require('dotenv/config')

const { Command } = require('commander')
const { isString } = require('lodash')
const SetupCoins = require('../src/services/SetupCoins')
const sequelize = require('../src/db/sequelize')

const program = new Command()
  .option('-a --all', 'setup all coins')
  .option('-f --fetch', 'fetch news coins')
  .option('-c --coins <coins>', 'setup only given coins')
  .option('-p --platform <platform>', 'force sync decimals for given platform type')
  .option('-p --platformType <platformType>', 'force sync decimals for given platform type')
  .option('--chains [coins]', 'sync with chains')
  .parse(process.argv)

async function start({ all, fetch, coins, platform, platformType, chains }) {
  await sequelize.sync()
  const setupCoins = new SetupCoins()

  try {
    if (fetch) {
      await setupCoins.fetchCoins(200000, 10000000)
    } else if (coins) {
      await setupCoins.setupCoins(coins.split(','))
    } else if (platform) {
      await setupCoins.forceSyncDecimals({ address: platform.split(',') })
    } else if (platformType) {
      await setupCoins.forceSyncDecimals({ platformType })
    } else if (all) {
      await setupCoins.setupCoins()
    } else if (chains) {
      await setupCoins.syncChains(isString(chains) && chains.split(','))
    }
  } catch (e) {
    console.log(e)
  }

  return setupCoins
}

module.exports = start(program.opts())
