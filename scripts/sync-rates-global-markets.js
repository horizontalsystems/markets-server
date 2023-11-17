require('dotenv/config')

const { Command } = require('commander')
const sequelize = require('../src/db/sequelize')
const UniversalSyncer = require('../src/services/UniversalSyncer')

const program = new Command()
  .option('-f --from <from>', 'syncs from given date')
  .option('-t --to <to>', 'syncs to given date')
  .parse(process.argv)

async function start() {
  await sequelize.sync()

  const universalSyncer = new UniversalSyncer()
  await universalSyncer.start()
}

module.exports = start(program.opts())
