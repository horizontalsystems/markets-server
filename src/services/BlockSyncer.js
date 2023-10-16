const { DateTime } = require('luxon')
const { chunk } = require('lodash')
const Syncer = require('./Syncer')
const Block = require('../db/models/Block')
const bigquery = require('../providers/bigquery')

class BlockSyncer extends Syncer {
  async syncFromTo(from, to) {
    const dateFrom = DateTime.fromISO(from).toFormat('yyyy-MM-01')
    const dateTo = DateTime.fromISO(to).toFormat('yyyy-MM-01')

    const blocks = await bigquery.getBlocks(dateFrom, dateTo)
    const chains = chunk(blocks, 400000)

    for (let i = 0; i < chains.length; i += 1) {
      await this.upsertBlocks(chains[i])
    }
  }

  async upsertBlocks(records) {
    await Block.bulkCreate(records, { updateOnDuplicate: ['hash', 'number'] })
      .then((data) => {
        console.log('Inserted block hashes', data.length)
      })
      .catch(err => {
        console.error(err)
      })
  }
}

module.exports = BlockSyncer
