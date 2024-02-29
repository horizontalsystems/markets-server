require('dotenv/config')

const { Command } = require('commander')
const sequelize = require('../src/db/sequelize')
const CategoryMarketCapSyncer = require('../src/services/CategoryMarketCapSyncer')
const TopPlatformsSyncer = require('../src/services/TopPlatformsSyncer')
const CoinRankSyncer = require('../src/services/CoinRankSyncer')
const PopularStatsSyncer = require('../src/services/PopularStatsSyncer')
const IndicatorSyncer = require('../src/services/IndicatorSyncer');

const program = new Command()
  .option('-c --category', 'sync top categories only')
  .option('-r --rating', 'sync coin ratings only')
  .option('-p --platforms', 'sync top platforms only')
  .option('-s --stats', 'sync popular stats')
  .option('-i --indicator', 'sync indicators')
  .option('--rank', 'sync coins rank only')
  .option('-f --force', 'force sync')
  .parse(process.argv)

async function start({ category, platforms, rank, force, stats, indicator }) {
  await sequelize.sync()
  const categoryMarketCapSyncer = new CategoryMarketCapSyncer()
  const coinRankSyncer = new CoinRankSyncer()
  const topPlatformsSyncer = new TopPlatformsSyncer()
  const indicatorSyncer = new IndicatorSyncer()
  const popularStatsSyncer = new PopularStatsSyncer()
  const syncers = []

  try {
    if (category) syncers.push(categoryMarketCapSyncer)
    if (rank) syncers.push(coinRankSyncer)
    if (platforms) syncers.push(topPlatformsSyncer)
    if (stats) syncers.push(popularStatsSyncer)
    if (indicator) syncers.push(indicatorSyncer)

    if (!syncers.length) {
      syncers.push(categoryMarketCapSyncer, coinRankSyncer, topPlatformsSyncer, popularStatsSyncer, indicatorSyncer)
    }

    await Promise.all(syncers.map(s => s.start(force))).catch(e => {
      throw e
    })
  } catch (e) {
    console.log(e.message)
    throw e
  }
}

module.exports = start(program.opts())
