require('dotenv/config')

const { Command } = require('commander')
const { isString } = require('lodash')
const SetupCoins = require('../src/services/SetupCoins')
const sequelize = require('../src/db/sequelize')

const program = new Command()
  .option('-f --fetch', 'fetch news coins')
  .option('-o --orphaned', 'fetch coins without gecko id')
  .option('-c --coins <coins>', 'setup only given coins')
  .option('--address-decimals <address>', 'force sync decimals for given address')
  .option('--chain-decimals <chain>', 'force sync decimals for given chain')
  .option('--coin-decimals <coin>', 'force sync decimals for given coin')
  .option('--token-type-decimals <type>', 'force sync decimals for given token type')
  .option('--chains [coins]', 'sync with chains')
  .option('--force', 'force sync')
  .parse(process.argv)

async function start({ fetch, coins, tokenTypeDecimals, addressDecimals, chainDecimals, coinDecimals, chains, orphaned, force }) {
  await sequelize.sync()
  const setupCoins = new SetupCoins()

  try {
    if (fetch) {
      await setupCoins.fetchNewCoinList()
    } else if (coins) {
      await setupCoins.setupCoins(coins.split(','), force)
    } else if (addressDecimals) {
      await setupCoins.forceSyncDecimals({ address: addressDecimals.split(',') })
    } else if (chainDecimals) {
      await setupCoins.forceSyncDecimals({ chain: chainDecimals })
    } else if (coinDecimals) {
      await setupCoins.forceSyncDecimals({ uid: coinDecimals })
    } else if (tokenTypeDecimals) {
      await setupCoins.forceSyncDecimals({ type: tokenTypeDecimals })
    } else if (chains) {
      await setupCoins.syncChains(isString(chains) && chains.split(','))
    } else if (orphaned) {
      await setupCoins.orphanedCoins()
    } else {
      await setupCoins.sync()
    }
  } catch (e) {
    console.log(e)
  }

  return setupCoins
}

module.exports = start(program.opts())
