require('dotenv/config')

const { Command } = require('commander')
const { isString } = require('lodash')
const SetupCoins = require('../src/services/SetupCoins')
const sequelize = require('../src/db/sequelize')

const program = new Command()
  .option('-a --all', 'setup all coins')
  .option('-f --fetch', 'fetch news coins')
  .option('-o --orphaned', 'fetch orphaned coins')
  .option('-c --coins <coins>', 'setup only given coins')
  .option('--address-decimals <address>', 'force sync decimals for given address')
  .option('--chain-decimals <chain>', 'force sync decimals for given chain')
  .option('--coin-decimals <coin>', 'force sync decimals for given coin')
  .option('--token-type-decimals <type>', 'force sync decimals for given token type')
  .option('--chains [coins]', 'sync with chains')
  .parse(process.argv)

async function start({ all, fetch, coins, tokenTypeDecimals, addressDecimals, chainDecimals, coinDecimals, chains, orphaned }) {
  await sequelize.sync()
  const setupCoins = new SetupCoins()

  try {
    if (fetch) {
      await setupCoins.fetchCoins()
    } else if (coins) {
      await setupCoins.setupCoins(coins.split(','))
    } else if (addressDecimals) {
      await setupCoins.forceSyncDecimals({ address: addressDecimals.split(',') })
    } else if (chainDecimals) {
      await setupCoins.forceSyncDecimals({ chain: chainDecimals })
    } else if (coinDecimals) {
      await setupCoins.forceSyncDecimals({ uid: coinDecimals })
    } else if (tokenTypeDecimals) {
      await setupCoins.forceSyncDecimals({ type: tokenTypeDecimals })
    } else if (all) {
      await setupCoins.setupCoins()
    } else if (chains) {
      await setupCoins.syncChains(isString(chains) && chains.split(','))
    } else if (orphaned) {
      await setupCoins.orphanedCoins()
    }
  } catch (e) {
    console.log(e)
  }

  return setupCoins
}

module.exports = start(program.opts())
