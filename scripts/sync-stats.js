require('dotenv/config')

const sequelize = require('../src/db/sequelize')
const CategoryMarketCapSyncer = require('../src/services/CategoryMarketCapSyncer')
const TopPlatformsSyncer = require('../src/services/TopPlatformsSyncer')
// const CoinRatingSyncer = require('../src/services/CoinRatingSyncer')

async function start() {
  await sequelize.sync()
  const categoryMarketCapSyncer = new CategoryMarketCapSyncer()
  // const coinRatingSyncer = new CoinRatingSyncer()
  const topPlatformsSyncer = new TopPlatformsSyncer()

  try {
    await categoryMarketCapSyncer.start()
    // await coinRatingSyncer.start()
    await topPlatformsSyncer.start()
  } catch (e) {
    console.log(e.message)
    throw e
  }
}

module.exports = start()
