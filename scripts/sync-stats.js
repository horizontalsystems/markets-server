require('dotenv/config')

const { Command } = require('commander')
const sequelize = require('../src/db/sequelize')
const CategoryMarketCapSyncer = require('../src/services/CategoryMarketCapSyncer')
const TopPlatformsSyncer = require('../src/services/TopPlatformsSyncer')
const CoinRankSyncer = require('../src/services/CoinRankSyncer')
const IndicatorSyncer = require('../src/services/IndicatorSyncer');

const program = new Command()
  .option('-c --category', 'sync top categories only')
  .option('-r --rating', 'sync coin ratings only')
  .option('-p --platforms', 'sync top platforms only')
  .option('-i --indicator', 'sync indicators')
  .option('--coins <coins>', 'run syncer for the given coins')
  .option('--rank', 'sync coins rank only')
  .option('-f --force', 'force sync')
  .parse(process.argv)

async function start({ category, platforms, rank, force, indicator, coins }) {
  await sequelize.sync()
  const categoryMarketCapSyncer = new CategoryMarketCapSyncer()
  const coinRankSyncer = new CoinRankSyncer()
  const topPlatformsSyncer = new TopPlatformsSyncer()
  const indicatorSyncer = new IndicatorSyncer()
  const syncers = []

  try {
    if (category) syncers.push(categoryMarketCapSyncer)
    if (rank) syncers.push(coinRankSyncer)
    if (platforms) syncers.push(topPlatformsSyncer)
    if (indicator) syncers.push(indicatorSyncer)

    if (!syncers.length) {
      syncers.push(categoryMarketCapSyncer, coinRankSyncer, topPlatformsSyncer, indicatorSyncer)
    }

    const mapper = s => {
      if (coins) {
        return s.syncHistorical(coins.split(','))
      }

      return s.start(force)
    }

    await Promise.all(syncers.map(mapper)).catch(e => {
      throw e
    })
  } catch (e) {
    console.log(e.message)
    throw e
  }
}

module.exports = start(program.opts())
