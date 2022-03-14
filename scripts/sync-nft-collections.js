require('dotenv/config')

const { Command } = require('commander')
const NftMarketSyncer = require('../src/services/NftMarketSyncer')
const sequelize = require('../src/db/sequelize')

const program = new Command()
  .option('-c --collections <collections>', 'sync only given collections')
  .parse(process.argv)

async function start({ collections }) {
  await sequelize.sync()
  const syncer = new NftMarketSyncer()

  if (collections) {
    // await syncer.syncHistorical(collections.split(','))
  } else {
    await syncer.start()
  }

  return syncer
}

module.exports = start(program.opts())
