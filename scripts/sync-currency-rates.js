require('dotenv/config')

const sequelize = require('../src/db/sequelize')
const CurrencyRateSyncer = require('../src/services/CurrencyRateSyncer')

async function start() {
  await sequelize.sync()
  const syncer = new CurrencyRateSyncer()
  await syncer.start()
}

module.exports = start()
