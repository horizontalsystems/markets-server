/* eslint-disable no-param-reassign */
const { utcDate } = require('../utils')
const defillama = require('../providers/defillama')
const opensea = require('../providers/opensea')
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
      const nftMarkets = await this.fetchNftMarkets()
      const nftCollections = await this.syncCollections(nftMarkets)
      await this.syncNftMarkets(nftCollections, dateTo)
    } catch (e) {
      console.error(e)
    }
  }

  async fetchNftMarkets() {
    let nftMarkets = []
    try {
      nftMarkets = await defillama.getNftCollections()
      logger.info(`Fetched new nftMarkets: ${nftMarkets.length}`)
    } catch (e) {
      logger.error(`Error syncing NFT markets: ${e.message}`)
    }

    return nftMarkets
  }

  async syncCollections(nftMarkets) {
    const collections = []
    try {

      for (let i = 0; i < nftMarkets.length; i += 1) {
        logger.info(`Getting: ${nftMarkets[i].slug}`)
        const collection = await opensea.getCollection(nftMarkets[i].slug)
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
