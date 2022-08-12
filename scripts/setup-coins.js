require('dotenv/config')

const { Command } = require('commander')
const { isString } = require('lodash')
const SetupCoins = require('../src/services/SetupCoins')
const sequelize = require('../src/db/sequelize')

const program = new Command()
  .option('-a --all', 'setup all coins')
  .option('-f --fetch', 'fetch news coins')
  .option('-c --coins <coins>', 'setup only given coins')
  .option('--address-decimals <address>', 'force sync decimals for given address')
  .option('--chain-decimals <chain>', 'force sync decimals for given chain')
  .option('--token-type-decimals <type>', 'force sync decimals for given token type')
  .option('--chains [coins]', 'sync with chains')
  .parse(process.argv)

async function start({ all, fetch, coins, tokenTypeDecimals, addressDecimals, chainDecimals, chains }) {
  await sequelize.sync()
  const setupCoins = new SetupCoins()

  try {
    if (fetch) {
      await setupCoins.fetchCoins(200000, 10000000)
    } else if (coins) {
      await setupCoins.setupCoins(coins.split(','))
    } else if (addressDecimals) {
      await setupCoins.forceSyncDecimals({ address: addressDecimals.split(',') })
    } else if (chainDecimals) {
      await setupCoins.forceSyncDecimals({ chain: chainDecimals })
    } else if (tokenTypeDecimals) {
      await setupCoins.forceSyncDecimals({ type: tokenTypeDecimals })
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
