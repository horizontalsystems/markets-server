require('dotenv/config')
const { Command } = require('commander')
const { isString } = require('lodash')

const sequelize = require('../src/db/sequelize')
const CategoryMarketCapSyncer = require('../src/services/CategoryMarketCapSyncer')
const TopPlatformsSyncer = require('../src/services/TopPlatformsSyncer')
// const CoinRatingSyncer = require('../src/services/CoinRatingSyncer')

const program = new Command()
  .option('--sync-supply [coins]', 'sync platforms circulating supply')
  .parse(process.argv)

async function start({ syncSupply }) {
  await sequelize.sync()
  const categoryMarketCapSyncer = new CategoryMarketCapSyncer()
  // const coinRatingSyncer = new CoinRatingSyncer()
  const topPlatformsSyncer = new TopPlatformsSyncer()

  try {
    if (syncSupply) {
      return topPlatformsSyncer.syncCirculatingSupply(isString(syncSupply) && syncSupply.split(','))
    }

    await categoryMarketCapSyncer.start()
    // await coinRatingSyncer.start()
    await topPlatformsSyncer.start()
  } catch (e) {
    console.log(e.message)
    throw e
  }
}

module.exports = start(program.opts())
