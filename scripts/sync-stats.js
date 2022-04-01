require('dotenv/config')

const sequelize = require('../src/db/sequelize')
const CategoryMarketCapSyncer = require('../src/services/CategoryMarketCapSyncer')
const CoinRatingSyncer = require('../src/services/CoinRatingSyncer')

async function start() {
  await sequelize.sync()
  const categoryMarketCapSyncer = new CategoryMarketCapSyncer()
  const coinRatingSyncer = new CoinRatingSyncer()

  try {
    await categoryMarketCapSyncer.start()
    await coinRatingSyncer.start()
  } catch (e) {
    console.log(e.message)
    throw e
  }
}

module.exports = start()
