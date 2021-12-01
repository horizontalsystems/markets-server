require('dotenv/config')

const sequelize = require('../src/db/sequelize')
const GlobalMarketsSyncer = require('../src/services/GlobalMarketsSyncer')

async function start() {
  await sequelize.sync()
  const globalMarketsSyncer = new GlobalMarketsSyncer()
  await globalMarketsSyncer.start()
}

module.exports = start()
