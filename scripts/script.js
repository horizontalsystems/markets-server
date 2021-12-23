require('dotenv/config')

const sequelize = require('../src/db/sequelize')
const bitquery = require('../src/providers/bitquery')

async function start() {
  await sequelize.sync()
  await bitquery.getTransfers()
}

module.exports = start()
