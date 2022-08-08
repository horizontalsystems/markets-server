require('dotenv/config')

const { Command } = require('commander')
const sequelize = require('../src/db/sequelize')
const CoinHolderSyncer = require('../src/services/CoinHolderSyncer')
const Platform = require('../src/db/models/Platform')

const program = new Command()
  .option('--chain <chain>', 'sync holders for given chain')
  .option('-c --coins <coins>', 'sync holders for given coins')
  .option('-n --nft <nft>', 'sync specific nft')
  .parse(process.argv)

async function start({ chain, coins, nft }) {
  await sequelize.sync()
  const coinHolderSyncer = new CoinHolderSyncer()

  if (chain) {
    await coinHolderSyncer.sync(await Platform.getByChain(chain, false, false))
  } else if (coins) {
    await coinHolderSyncer.sync(await Platform.findByCoinUID(coins.split(',')))
  } else if (nft) {
    await coinHolderSyncer.syncNft(nft)
  } else {
    await coinHolderSyncer.start()
  }
}

module.exports = start(program.opts())
