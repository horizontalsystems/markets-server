/* eslint-disable no-param-reassign */
const { utcDate } = require('../utils')
const opensea = require('../providers/opensea')
const { dune } = require('../providers/dune')
const NftMarket = require('../db/models/NftMarket')
const NftCollection = require('../db/models/NftCollection')
const Syncer = require('./Syncer')
const logger = require('../config/logger')
const { sleep } = require('../utils')

class NftMarketSyncer extends Syncer {

  async start() {
    await this.syncHistorical()
    await this.syncLatest()
  }

  async syncHistorical() {
    this.syncMarkets(utcDate({}, 'yyyy-MM-dd HH:mm:00Z'))
  }

  async syncLatest() {
    this.cron('30m', this.syncDailyStats)
    this.cron('2h', this.fetchTopNftCollections)
    this.cron('1d', this.syncMonthlyStats)
  }

  async syncDailyStats({ dateTo }) {
    await this.syncMarkets(dateTo)
  }

  async syncMonthlyStats({ dateFrom, dateTo }) {
    await this.adjustPoints(dateFrom, dateTo)
  }

  async adjustPoints({ dateFrom, dateTo }) {
    await NftMarket.deleteExpired(dateFrom, dateTo)
  }

  async syncMarkets(dateTo) {
    try {
      if (!this.topNftCollections) {
        await this.fetchTopNftCollections()
      }
      const nftCollections = await this.syncCollections()
      await this.syncNftMarkets(nftCollections, dateTo)
    } catch (e) {
      console.error(e)
    }
  }

  async fetchTopNftCollections() {
    try {
      this.topNftCollections = await dune.getTopNftCollections()
      logger.info(`Fetched new Top NFT collections: ${this.topNftCollections.length}`)
    } catch (e) {
      logger.error(`Error fetching Top Nft collections: ${e.message}`)
    }
  }

  async syncCollections() {
    const collections = []
    try {

      for (let i = 0; i < this.topNftCollections.length; i += 1) {
        logger.info(`Getting: ${this.topNftCollections[i].collection_uid}`)
        const collection = await opensea.getCollection(this.topNftCollections[i].collection_uid)
        if (collection) {
          collections.push(collection)
        }

        await sleep(3000) // wait to bypass API limits
      }

      await this.upsertNftCollections(collections)
      logger.info(`Successfully synced collections: ${collections.length}`)

    } catch (e) {
      logger.error(`Error syncing NFT collections: ${e}`)
    }

    return collections
  }

  async syncNftMarkets(nftCollections, dateTo) {
    try {

      const collectionsData = await this.getCollections(nftCollections.map(c => c.uid))
      const markets = nftCollections.map(data => ({
        volume24h: data.stats.one_day_volume,
        total_volume: data.stats.total_volume,
        sales24h: data.stats.one_day_sales,
        total_sales: data.stats.total_sales,
        floor_price: data.stats.floor_price,
        avg_price: data.stats.average_price,
        owners: data.stats.num_owners,
        collection_id: collectionsData.map[data.uid],
        date: dateTo
      }))

      this.upsertNftMarkets(markets)
      logger.info('Successfully synced NFT markets !!!')

    } catch (e) {
      logger.error(`Error syncing NFT markets: ${e}`)
    }
  }

  async getCollections(collectionUids) {
    const collections = await NftCollection.getByUids(collectionUids)
    const list = []
    const map = {}

    collections.forEach(({ id, uid }) => {
      map[uid] = id
      list.push({ uid })
    })

    return { list, map }
  }

  upsertNftMarkets(markets) {
    NftMarket.bulkCreate(markets, {
      updateOnDuplicate: ['volume24h', 'total_volume', 'floor_price', 'avg_price', 'owners']
    })
      .catch(err => {
        console.error('Error inserting NFT markets', err.message)
      })
  }

  upsertNftCollections(collections) {
    NftCollection.bulkCreate(collections, {
      updateOnDuplicate: ['stats']
    })
      .catch(err => {
        console.error('Error inserting NFT collections', err.message)
      })
  }
}

module.exports = NftMarketSyncer
