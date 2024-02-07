const Syncer = require('./Syncer')
const mongo = require('../db/mongo')

class PopularStatsSyncer extends Syncer {
  async start(force) {
    if (force) {
      return this.sync()
    }

    this.cron('4h', this.sync)
  }

  async sync() {
    const coins = await mongo.getPopularCoins()
    const resources = await mongo.getPopularResources()
    await mongo.storeStats(coins, 'coin_stats')
    await mongo.storeStats(resources, 'resource_stats')
    console.log('Popular stats Synced')
  }
}

module.exports = PopularStatsSyncer
