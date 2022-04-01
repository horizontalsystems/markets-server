require('dotenv/config')

const sequelize = require('../src/db/sequelize')
const CategoryMarketCapSyncer = require('../src/services/CategoryMarketCapSyncer')

async function start() {
  await sequelize.sync()
  const categoryMarketCapSyncer = new CategoryMarketCapSyncer()

  try {
    await categoryMarketCapSyncer.start()
  } catch (e) {
    console.log(e.message)
    throw e
  }
}

module.exports = start()
