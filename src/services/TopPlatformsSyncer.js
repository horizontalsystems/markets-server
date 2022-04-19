const Syncer = require('./Syncer')
const Platform = require('../db/models/Platform')
const PlatformStats = require('../db/models/PlatformStats')
const PlatformStatsHistory = require('../db/models/PlatformStatsHistory')
const bscscan = require('../providers/bscscan')
const getCSupplies = require('../providers/csupply')
const utils = require('../utils')
const { utcDate, percentageBetweenNumber } = require('../utils')

class TopPlatformsSyncer extends Syncer {
  async start() {
    await this.syncHistorical()
    await this.syncLatest()
  }

  async syncCirculatingSupply() {
    const map = {}
    const platforms = await Platform.getMarketCap()
    const platformsBep20 = platforms.filter(p => p.type === 'bep20' && p.multi_chain_id && p.decimals)
    const supplies = await getCSupplies()

    const setCSupply = platform => {
      switch (platform.uid) {
        case 'tether':
        case 'usd-coin': {
          const supply = supplies[platform.uid] || {}
          if (supply[platform.type]) {
            map[platform.id] = supply[platform.type]
          }
          break
        }
        case 'wrapped-bitcoin':
        case 'weth':
        case 'chainlink':
        case 'uniswap':
        case 'sushi':
        case 'dai':
        case 'frax':
        case 'true-usd':
        case 'yearn-finance':
        case 'aave':
        case '1inch':
        case 'compound-governance-token':
        case 'multichain':
        case 'anyswap':
        case 'matic-network': {
          if (platform.type === 'erc20') {
            map[platform.id] = platform.csupply
          }
          break
        }
        case 'binance-usd':
        case 'krown':
          if (platform.type === 'bep20') {
            map[platform.id] = platform.csupply
          }
          break
        default:
          if (['bep20', 'erc20'].includes(platform.type)) {
            map[platform.id] = platform.csupply
          }
      }
    }

    for (let i = 0; i < platforms.length; i += 1) {
      const platform = platforms[i]

      if (!platform.csupply) {
        continue
      }

      if (platform.multi_chain_id) {
        setCSupply(platform)
      } else {
        map[platform.id] = platform.csupply
      }
    }

    for (let i = 0; i < platformsBep20.length; i += 1) {
      const platform = platformsBep20[i]
      const supply = await bscscan.getCSupply(platform.address)
      if (supply) {
        map[platform.id] = supply / (10 ** platform.decimals)
      }
      await utils.sleep(150)
    }

    await Platform.updateCSupplies(Object.entries(map))
      .then(() => {
        console.log('Updates platforms circulating supplies')
      })
      .catch(e => {
        console.log(e)
      })
  }

  async syncHistorical() {
    const platforms = await PlatformStats.getStats()
    const records = platforms.map(p => ({
      name: p.type,
      protocols: p.protocols,
      market_cap: p.mcap
    }))

    await this.upsertPlatformStats(records)
  }

  async syncLatest() {
    this.cron('1d', this.syncDailyStats)
  }

  async syncDailyStats({ dateFrom, dateTo }) {
    const platformStats = await PlatformStats.getStats()
    const mapped = await this.mapMarketCaps()

    const platformStatsUpdate = []
    const platformStatsHistory = []

    for (let i = 0; i < platformStats.length; i += 1) {
      const platform = platformStats[i]
      const prevMCap = mapped[platform.id] || {}

      if (platform.id) {
        platformStatsHistory.push({
          platform_stats_id: platform.id,
          market_cap: platform.mcap,
          date: dateTo
        })
      }

      platformStatsUpdate.push({
        name: platform.type,
        market_cap: platform.mcap,
        stats: {
          change_1d: percentageBetweenNumber(prevMCap['1d'], platform.mcap),
          change_1w: percentageBetweenNumber(prevMCap['1w'], platform.mcap),
          change_1m: percentageBetweenNumber(prevMCap['1m'], platform.mcap),
        }
      })
    }

    await this.upsertPlatformStats(platformStatsUpdate)
    await this.upsertPlatformStatsHistory(platformStatsHistory)
    await PlatformStatsHistory.deleteExpired(dateFrom, dateTo)
  }

  async mapMarketCaps() {
    const mapped = {}
    const mapBy = (items, key) => {
      for (let i = 0; i < items.length; i += 1) {
        const item = items[i]
        const map = mapped[item.platform_stats_id] || (mapped[item.platform_stats_id] = {})

        map[key] = item.market_cap
      }
    }

    const history1d = await PlatformStatsHistory.findAll({ where: { date: utcDate({ day: -1 }, 'yyyy-MM-dd') } })
    const history1w = await PlatformStatsHistory.findAll({ where: { date: utcDate({ days: -7 }) } })
    const history1m = await PlatformStatsHistory.findAll({ where: { date: utcDate({ days: -30 }) } })

    mapBy(history1d, '1d')
    mapBy(history1w, '1w')
    mapBy(history1m, '1m')

    return mapped
  }

  upsertPlatformStats(items) {
    return PlatformStats.bulkCreate(items, { updateOnDuplicate: ['market_cap', 'stats'] })
      .then(records => {
        console.log(`Inserted ${records.length} platform market caps`)
      })
      .catch(err => {
        console.error(err)
      })
  }

  upsertPlatformStatsHistory(items) {
    return PlatformStatsHistory.bulkCreate(items, { ignoreDuplicates: true })
      .then(records => {
        console.log(`Inserted ${records.length} platform market caps history`)
      })
      .catch(err => {
        console.error(err)
      })
  }
}

module.exports = TopPlatformsSyncer
