require('dotenv/config')

const sequelize = require('../src/db/sequelize')
const CoinSyncer = require('../src/services/CoinSyncer')

async function start() {
  await sequelize.sync()
  const syncer = new CoinSyncer()
  await syncer.start()
}

module.exports = start()
