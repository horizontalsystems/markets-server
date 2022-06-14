require('dotenv/config')

const { DateTime } = require('luxon')
const { Command } = require('commander')
const { chunk } = require('lodash')
const sequelize = require('../src/db/sequelize')
const bigquery = require('../src/providers/bigquery')
const Block = require('../src/db/models/Block')

const program = new Command()
  .option('-f --from <from>', 'syncs from given date')
  .option('-t --to <to>', 'syncs to given date')
  .parse(process.argv)

async function upsertBlocks(records) {
  await Block.bulkCreate(records, { updateOnDuplicate: ['hash', 'number'] })
    .then((data) => {
      console.log('Inserted block hashes', data.length)
    })
    .catch(err => {
      console.error(err)
    })
}

async function start({ from, to }) {
  await sequelize.sync()

  const dateFrom = DateTime.fromISO(from).toFormat('yyyy-MM-01')
  const dateTo = DateTime.fromISO(to).toFormat('yyyy-MM-01')

  const blocks = await bigquery.getBlocks(dateFrom, dateTo)
  const chains = chunk(blocks, 400000)

  for (let i = 0; i < chains.length; i += 1) {
    await upsertBlocks(chains[i])
  }
}

module.exports = start(program.opts())
