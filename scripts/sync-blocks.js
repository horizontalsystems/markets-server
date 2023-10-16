require('dotenv/config')

const { Command } = require('commander')
const sequelize = require('../src/db/sequelize')
const BlockSyncer = require('../src/services/BlockSyncer')

const program = new Command()
  .option('-f --from <from>', 'syncs from given date')
  .option('-t --to <to>', 'syncs to given date')
  .parse(process.argv)

async function start({ from, to }) {
  await sequelize.sync()

  const syncer = new BlockSyncer()

  if (from && to) {
    await syncer.syncFromTo(from, to)
  } else {
    throw new Error('`From` and `to` is required')
  }
}

module.exports = start(program.opts())
