require('dotenv/config')

const sequelize = require('../src/db/sequelize')
const CoinHolderSyncer = require('../src/services/CoinHolderSyncer')

async function start() {
  await sequelize.sync()
  const coinHolderSyncer = new CoinHolderSyncer()
  await coinHolderSyncer.start()
}

module.exports = start()
