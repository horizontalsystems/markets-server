require('dotenv/config')

const sequelize = require('../src/db/sequelize')
const CoinMarketSyncer = require('../src/services/CoinMarketSyncer')

async function start() {
  await sequelize.sync()
  const syncer = new CoinMarketSyncer()
  await syncer.start()
}

module.exports = start()
