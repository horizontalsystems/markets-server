const Syncer = require('./Syncer')
const Platform = require('../db/models/Platform')
const Chain = require('../db/models/Chain')
const ChainMarketCap = require('../db/models/ChainMarketCap')
const bscscan = require('../providers/bscscan')
const getCSupplies = require('../providers/csupply')
const { utcDate, percentageChange, sleep } = require('../utils')

class TopPlatformsSyncer extends Syncer {
  async start() {
    await this.syncHistorical()
    await this.syncLatest()
  }

  async syncCirculatingSupply(uids) {
    const map = {}
    const platforms = await Platform.getMarketCap(uids)
    const platformsBep20 = platforms.filter(p => p.chain_uid === 'binance-smart-chain' && p.multi_chain_id && p.decimals)
    const supplies = await getCSupplies()

    const setCSupply = platform => {
      switch (platform.uid) {
        case 'tether':
        case 'usd-coin': {
          const supply = supplies[platform.uid] || {}
          if (supply[platform.uid]) {
            map[platform.id] = supply[platform.uid]
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
          if (platform.type === 'eip20') {
            map[platform.id] = platform.csupply
          }
          break
        }
        case 'binance-usd':
        case 'krown':
          if (platform.type === 'eip20') {
            map[platform.id] = platform.csupply
          }
          break
        default:
          if (platform.type === 'eip20') {
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
      const supplyStr = await bscscan.getCSupply(platform.address)
      if (supplyStr) {
        const supply = supplyStr / (10 ** platform.decimals)
        if (supply) {
          map[platform.id] = supply
        }
      }
      await sleep(150)
    }

    await Platform.updateCSupplies(Object.entries(map))
      .then(() => {
        console.log('Updated platforms circulating supplies')
      })
      .catch(e => {
        console.log(e)
      })
  }

  async syncHistorical() {
    if (await ChainMarketCap.exists()) {
      return
    }

    const stats = await Chain.getStats()
    const records = stats.map(i => [
      i.uid,
      JSON.stringify({
        market_cap: i.mcap,
        protocols: i.protocols
      })
    ])

    await this.updateChains(records)
  }

  async syncLatest() {
    this.cron('1h', this.syncDailyStats)
    this.cron('1d', this.syncMonthlyStats)
  }

  async syncDailyStats({ dateTo }) {
    const stats = await Chain.getStats()
    const historyMap = await this.mapMarketCaps()

    const statsUpdate = []
    const marketCapsUpdate = []

    for (let i = 0; i < stats.length; i += 1) {
      const data = stats[i]
      const prevMCap = historyMap[data.uid] || {}
      const prevMCap1d = prevMCap['1d'] || {}
      const prevMCap1w = prevMCap['1w'] || {}
      const prevMCap1m = prevMCap['1m'] || {}

      if (!data.uid) {
        continue
      }

      marketCapsUpdate.push({
        chain_uid: data.uid,
        market_cap: data.mcap,
        date: dateTo
      })

      statsUpdate.push([
        data.uid,
        JSON.stringify({
          protocols: data.protocols,
          market_cap: data.mcap,
          rank_1d: prevMCap1d.rank,
          rank_1w: prevMCap1w.rank,
          rank_1m: prevMCap1m.rank,
          change_1d: percentageChange(prevMCap1d.mcap, data.mcap),
          change_1w: percentageChange(prevMCap1w.mcap, data.mcap),
          change_1m: percentageChange(prevMCap1m.mcap, data.mcap)
        })
      ])
    }

    await this.updateChains(statsUpdate)
    await this.upsertMarketCaps(marketCapsUpdate)
  }

  async syncMonthlyStats({ dateFrom, dateTo }) {
    await ChainMarketCap.deleteExpired(dateFrom, dateTo)
  }

  async mapMarketCaps() {
    const mapped = {}
    const mapBy = (items, key) => {
      for (let i = 0; i < items.length; i += 1) {
        const item = items[i]
        const map = mapped[item.chain_uid] || (mapped[item.chain_uid] = {})

        map[key] = {
          rank: item.ranked,
          mcap: item.market_cap
        }
      }
    }

    const format = 'yyyy-MM-dd HH:00:00Z'
    const history1d = await ChainMarketCap.getByDate(utcDate({ days: -1 }, format))
    const history1w = await ChainMarketCap.getByDate(utcDate({ days: -7 }, format))
    const history1m = await ChainMarketCap.getByDate(utcDate({ days: -30 }, format))

    mapBy(history1d, '1d')
    mapBy(history1w, '1w')
    mapBy(history1m, '1m')

    return mapped
  }

  updateChains(values) {
    return Chain.updateStats(values)
      .then(([, updated]) => {
        console.log(`Inserted ${updated} chains`)
      })
      .catch(err => {
        console.error(err)
      })
  }

  upsertMarketCaps(items) {
    return ChainMarketCap.bulkCreate(items, { ignoreDuplicates: true })
      .then(records => {
        console.log(`Inserted ${records.length} chains market caps history`)
      })
      .catch(err => {
        console.log(err)
      })
  }
}

module.exports = TopPlatformsSyncer
