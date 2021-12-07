require('dotenv/config')

const { Command } = require('commander')
const DefiProtocolSyncer = require('../src/services/DefiProtocolSyncer')
const sequelize = require('../src/db/sequelize')

const program = new Command()
  .option('-p --protocols <protocols>', 'sync only given protocols')
  .parse(process.argv)

async function start({ protocols }) {
  await sequelize.sync()
  const syncer = new DefiProtocolSyncer()

  if (protocols) {
    await syncer.syncHistorical(protocols.split(','))
  } else {
    await syncer.start()
  }

  return syncer
}

module.exports = start(program.opts())
