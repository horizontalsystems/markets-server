require('dotenv/config')

const sequelize = require('../src/db/sequelize')
const DefiCoinSyncer = require('../src/services/DefiProtocolSyncer')

async function start() {
  await sequelize.sync()
  const syncer = new DefiCoinSyncer()
  await syncer.start()
}

module.exports = start()
