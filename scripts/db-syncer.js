require('dotenv/config')

const { Command } = require('commander')

const sequelize = require('../src/db/sequelize')
const Exchange = require('../src/db/models/Exchange')
const UpdateState = require('../src/db/models/UpdateState')
const exchanges = require('../src/db/seeders/exchanges.json')

const program = new Command()
  .option('-a --aa [aa]', 'aaa')
  .parse(process.argv)

async function start() {
  await sequelize.sync()
  await Exchange.bulkCreate(exchanges, { ignoreDuplicates: true })
  await UpdateState.reset('exchanges')
  console.log('Exchanges synced')
}

module.exports = start(program.opts())
