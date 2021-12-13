require('dotenv/config')

const sequelize = require('../src/db/sequelize')
const CoinPriceSyncer = require('../src/services/CoinPriceSyncer')

async function start() {
  await sequelize.sync()
  const syncer = new CoinPriceSyncer()
  await syncer.start()
}

module.exports = start()
