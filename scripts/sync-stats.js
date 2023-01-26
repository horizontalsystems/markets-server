require('dotenv/config')

const { Command } = require('commander')
const sequelize = require('../src/db/sequelize')
const CategoryMarketCapSyncer = require('../src/services/CategoryMarketCapSyncer')
const TopPlatformsSyncer = require('../src/services/TopPlatformsSyncer')
const CoinRatingSyncer = require('../src/services/CoinRatingSyncer')

const program = new Command()
  .option('-c --category', 'sync top categories only')
  .option('-r --rating', 'sync coin ratings only')
  .option('-p --platforms', 'sync top platforms only')
  .parse(process.argv)

async function start({ category, rating, platforms }) {
  await sequelize.sync()
  const categoryMarketCapSyncer = new CategoryMarketCapSyncer()
  const coinRatingSyncer = new CoinRatingSyncer()
  const topPlatformsSyncer = new TopPlatformsSyncer()
  const syncers = []

  try {

    if (category) syncers.push(categoryMarketCapSyncer)
    if (rating) syncers.push(coinRatingSyncer)
    if (platforms) syncers.push(topPlatformsSyncer)

    if (!syncers.length) {
      syncers.push(categoryMarketCapSyncer, coinRatingSyncer, topPlatformsSyncer)
    }

    await categoryMarketCapSyncer.start()
    await coinRatingSyncer.start()
    await topPlatformsSyncer.start()
  } catch (e) {
    console.log(e.message)
    throw e
  }
}

module.exports = start(program.opts())
