const Syncer = require('./Syncer')
const Platform = require('../db/models/Platform')
const PlatformStats = require('../db/models/PlatformStats')
const PlatformStatsHistory = require('../db/models/PlatformStatsHistory')
const bscscan = require('../providers/bscscan')
const getCSupplies = require('../providers/csupply')
const { utcDate, percentageBetweenNumber, sleep } = require('../utils')

class TopPlatformsSyncer extends Syncer {
  async start() {
    await this.syncHistorical()
    await this.syncLatest()
  }

  async syncCirculatingSupply(uids) {
    const map = {}
    const platforms = await Platform.getMarketCap(uids)
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
      await sleep(150)
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
    if (await PlatformStats.exists()) {
      return
    }

    const platforms = await PlatformStats.getStats()
    const records = platforms.map(p => ({
      name: p.type,
      protocols: p.protocols,
      market_cap: p.mcap
    }))

    await this.upsertPlatformStats(records)
  }

  async syncLatest() {
    this.cron('1h', this.syncDailyStats)
    this.cron('1d', this.syncMonthlyStats)
  }

  async syncDailyStats({ dateTo }) {
    const mapped = await this.mapMarketCaps()
    const platformStats = await PlatformStats.getStats()

    const platformStatsUpdate = []
    const platformStatsHistory = []

    for (let i = 0; i < platformStats.length; i += 1) {
      const platform = platformStats[i]
      const prevMCap = mapped[platform.id] || {}
      const prevMCap1d = prevMCap['1d'] || {}
      const prevMCap1w = prevMCap['1w'] || {}
      const prevMCap1m = prevMCap['1m'] || {}

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
          rank_1d: prevMCap1d.rank,
          rank_1w: prevMCap1w.rank,
          rank_1m: prevMCap1m.rank,
          protocols: platform.protocols,
          change_1d: percentageBetweenNumber(prevMCap1d.mcap, platform.mcap),
          change_1w: percentageBetweenNumber(prevMCap1w.mcap, platform.mcap),
          change_1m: percentageBetweenNumber(prevMCap1m.mcap, platform.mcap),
        }
      })
    }

    await this.upsertPlatformStats(platformStatsUpdate)
    await this.upsertPlatformStatsHistory(platformStatsHistory)
  }

  async syncMonthlyStats({ dateFrom, dateTo }) {
    await PlatformStatsHistory.deleteExpired(dateFrom, dateTo)
  }

  async mapMarketCaps() {
    const mapped = {}
    const mapBy = (items, key) => {
      for (let i = 0; i < items.length; i += 1) {
        const item = items[i]
        const map = mapped[item.platform_stats_id] || (mapped[item.platform_stats_id] = {})

        map[key] = {
          rank: item.ranked,
          mcap: item.market_cap
        }
      }
    }

    const format = 'yyyy-MM-dd HH:00:00Z'
    const history1d = await PlatformStatsHistory.getByDate(utcDate({ days: -1 }, format))
    const history1w = await PlatformStatsHistory.getByDate(utcDate({ days: -7 }, format))
    const history1m = await PlatformStatsHistory.getByDate(utcDate({ days: -30 }, format))

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
