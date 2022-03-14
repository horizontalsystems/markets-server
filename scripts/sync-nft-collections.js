require('dotenv/config')

const { Command } = require('commander')
const NftMarketSyncer = require('../src/services/NftMarketSyncer')
const sequelize = require('../src/db/sequelize')

const program = new Command()
  .parse(process.argv)

async function start() {
  await sequelize.sync()
  const syncer = new NftMarketSyncer()

  await syncer.start()

  return syncer
}

module.exports = start(program.opts())
