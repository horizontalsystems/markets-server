require('dotenv/config')

const { Command } = require('commander')
const sequelize = require('../src/db/sequelize')
const TokenUnlockSyncer = require('../src/services/TokenUnlockSyncer')

const program = new Command()
  .option('-c --coins <coins>', 'sync for the specific coins')
  .option('-u --unlocks', 'sync token unlocks')
  .parse(process.argv)

async function start({ coins, unlocks }) {
  await sequelize.sync()
  const unlockSyncer = new TokenUnlockSyncer()
  const syncers = []

  if (unlocks) syncers.push(unlockSyncer)

  if (!syncers.length) {
    syncers.push(unlockSyncer)
  }

  const mapper = s => {
    if (coins) {
      return s.sync(coins.split(','))
    }

    return s.start()
  }

  await Promise.all(syncers.map(mapper)).catch(e => {
    throw e
  })
}

module.exports = start(program.opts())
