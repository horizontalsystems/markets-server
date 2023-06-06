/* eslint-disable no-param-reassign */
const opensea = require('../providers/opensea')
const Syncer = require('./Syncer')
const { sequelize, NftCollection } = require('../db/sequelize')

class NftMarketSyncer extends Syncer {

  async start() {
    await this.syncHistorical()
    await this.syncLatest()
  }

  async syncHistorical() {
    await this.syncTopCollections()
  }

  async syncLatest() {
    this.cron('2h', this.syncTopCollections)
  }

  async syncTopCollections() {
    try {
      const nftCollections = [
        ...await opensea.getTopCollections(0),
        ...await opensea.getTopCollections(50)
      ]
      await this.upsertNftCollections(nftCollections)
    } catch (e) {
      console.error(e)
    }
  }

  async upsertNftCollections(collections) {
    const records = collections.map(item => {
      return {
        uid: item.slug,
        name: item.name,
        asset_contracts: item.addresses,
        image_data: {
          image_url: item.imageUrl
        },
        stats: item.stats,
        last_updated: new Date()
      }
    })

    if (records.length < 50) {
      return
    }

    let transaction
    try {
      transaction = await sequelize.transaction()

      await NftCollection.destroy({ where: {} })
      await NftCollection.bulkCreate(records, { updateOnDuplicate: ['stats', 'image_data'] })

      await transaction.commit()
      console.log('Sync top NFT collections')
    } catch (err) {
      console.log(err)

      if (transaction) {
        await transaction.rollback()
      }
    }
  }
}

module.exports = NftMarketSyncer
