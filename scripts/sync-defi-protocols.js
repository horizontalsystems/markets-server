require('dotenv/config')

const { Command } = require('commander')
const DefiProtocolSyncer = require('../src/services/DefiProtocolSyncer')
const sequelize = require('../src/db/sequelize')

const program = new Command()
  .option('-p --protocols <protocols>', 'sync only given protocols')
  .option('-m --merge', 'merge parent and child protocols data')
  .parse(process.argv)

async function start({ protocols, merge }) {
  await sequelize.sync()
  const syncer = new DefiProtocolSyncer()

  if (merge) {
    await syncer.mergeProtocols()
  } else if (protocols) {
    await syncer.syncHistorical(protocols.split(','))
  } else {
    await syncer.start()
  }

  return syncer
}

module.exports = start(program.opts())
