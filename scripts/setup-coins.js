require('dotenv/config')

const { Command } = require('commander')
const SetupCoins = require('../src/services/SetupCoins')
const sequelize = require('../src/db/sequelize')

const program = new Command()
  .option('-a --all', 'setup all coins')
  .option('-f --fetch', 'fetch news coins')
  .option('-c --coins <coins>', 'setup only given coins')
  .option('-p --platform <platform>', 'force sync decimals for given platform type')
  .option('--chains', 'setup chains')
  .option('--chains-sync', 'sync chains')
  .parse(process.argv)

async function start({ all, fetch, coins, platform, chains, chainsSync }) {
  await sequelize.sync()
  const setupCoins = new SetupCoins()

  try {
    if (fetch) {
      await setupCoins.fetchCoins(200000)
    } else if (coins) {
      await setupCoins.setupCoins(coins.split(','))
    } else if (platform) {
      await setupCoins.forceSyncPlatforms(platform)
    } else if (all) {
      await setupCoins.setupCoins()
    } else if (chains) {
      await setupCoins.setupChains()
    } else if (chainsSync) {
      await setupCoins.syncChains()
    }
  } catch (e) {
    console.log(e)
  }

  return setupCoins
}

module.exports = start(program.opts())
