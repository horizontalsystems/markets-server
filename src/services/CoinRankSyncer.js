const Syncer = require('./Syncer')
const Coin = require('../db/models/Coin')
const CoinStats = require('../db/models/CoinStats')
const Platform = require('../db/models/Platform')
const tokenterminal = require('../providers/tokenterminal')
const dune = require('../providers/dune')

class CoinRankSyncer extends Syncer {
  async start(force) {
    if (force) {
      return this.syncForce()
    }

    this.cron('1h', () => this.sync())
    this.cron('1h', () => this.syncRestStats())
    this.cron('1d', () => this.sync(true))
  }

  async syncForce() {
    console.log('Force sync ranks')
    await this.sync()
  }

  async sync(isFull) {
    const map = {}
    const stats = await CoinStats.query('SELECT * from coin_stats')

    const pickIfExists = (memo, object, fields) => {
      for (let i = 0; i < fields.length; i += 1) {
        const field = fields[i];
        const value = object[field]

        if (value) {
          memo[field] = value
        }
      }

      const val = object[fields]
      if (val) {
        map[fields] = val
      }
    }

    for (let i = 0; i < stats.length; i += 1) {
      const { coin_id: coinId, rank } = stats[i]
      const item = {}

      // These fields should be kept
      pickIfExists(item, rank, ['tvl',
        'liquidity',
        'tx_day',
        'tx_week',
        'tx_month',
        'cex_volume_day',
        'cex_volume_week',
        'cex_volume_month',
        'dex_volume_day',
        'dex_volume_week',
        'dex_volume_month',
        'address_day',
        'address_week',
        'address_month',
        'revenue_day',
        'revenue_week',
        'revenue_month'
      ])

      if (!isFull) {
        pickIfExists(item, rank, [
          'tx_week_rank',
          'tx_month_rank',
          'cex_volume_week_rank',
          'cex_volume_month_rank',
          'dex_volume_week_rank',
          'dex_volume_month_rank',
          'address_week_rank',
          'address_month_rank',
          'revenue_week_rank',
          'revenue_month_rank'
        ])
      }

      map[coinId] = item
    }

    const cexVolumes = await this.getCexVolumesRank(isFull)
    const dexVolumes = await this.getDexVolumesRank(isFull)
    const transactions = await this.getTransactionRank(isFull)
    const dexLiquidity = await this.getDexLiquidityRank()
    const tvls = await this.getTvlRank()
    const address = await this.getAddressRank(isFull)
    const revenue = await this.getRevenue()

    const lengths = Math.max(
      cexVolumes.daily.length,
      cexVolumes.weekly.length,
      cexVolumes.monthly.length,
      dexVolumes.daily.length,
      dexVolumes.weekly.length,
      dexVolumes.monthly.length,
      transactions.daily.length,
      transactions.weekly.length,
      transactions.monthly.length,
      address.daily.length,
      address.weekly.length,
      address.monthly.length,
      revenue.daily.length,
      revenue.weekly.length,
      revenue.monthly.length,
      tvls.length,
      dexLiquidity.length,
    )

    const setRank = (key, record, isTx) => {
      if (!record || !record.id) {
        return
      }

      const item = {
        ...map[record.id],
        [key]: String(record.volume),
        [`${key}_rank`]: String(record.rank)
      }

      if (isTx) {
        item[`${key}_count_rank`] = record.count
      }

      map[record.id] = item
    }

    for (let i = 0; i < lengths; i += 1) {
      setRank('cex_volume_day', cexVolumes.daily[i])
      setRank('cex_volume_week', cexVolumes.weekly[i])
      setRank('cex_volume_month', cexVolumes.monthly[i])

      setRank('dex_volume_day', dexVolumes.daily[i])
      setRank('dex_volume_week', dexVolumes.weekly[i])
      setRank('dex_volume_month', dexVolumes.monthly[i])
      setRank('liquidity', dexLiquidity[i])

      setRank('tx_day', transactions.daily[i], true)
      setRank('tx_week', transactions.weekly[i], true)
      setRank('tx_month', transactions.monthly[i], true)

      setRank('tvl', tvls[i])
      setRank('address_day', address.daily[i])
      setRank('address_week', address.weekly[i])
      setRank('address_month', address.monthly[i])

      setRank('revenue_day', revenue.daily[i])
      setRank('revenue_week', revenue.weekly[i])
      setRank('revenue_month', revenue.monthly[i])
    }

    await this.storeStats(map)
  }

  async syncRestStats() {
    const coins = await CoinStats.getOtherStats()
    const records = []

    for (let i = 0; i < coins.length; i += 1) {
      const coin = coins[i];
      const data = {}

      if (coin.funds_invested > 0) {
        data.funds_invested = coin.funds_invested
      }
      if (coin.treasuries > 0) {
        data.treasuries = coin.treasuries
      }
      if (coin.reports > 0) {
        data.reports = coin.reports
      }

      records.push({
        coin_id: coin.id,
        other: data
      })
    }

    await CoinStats.query('update coin_stats set other = jsonb_set(other, \'{}\', null) where other is not null')
    await CoinStats.bulkCreate(records, { updateOnDuplicate: ['other'] })
      .then(recs => {
        console.log('Upserted other stats', recs.length)
      })
      .catch(e => {
        console.log(e)
      })
  }

  async getCexVolumesRank(isFull) {
    console.log('Getting Cex Volumes Rank')
    const result = {
      daily: [],
      weekly: [],
      monthly: []
    }

    const query = `
      with records as (
        SELECT
          t1.coin_id as id, sum(t1.volume) as volume
        FROM coin_prices t1
        JOIN (
          SELECT
            coin_id, DATE_TRUNC('day', date) as trunc, max(id) as max_id
           FROM coin_prices
          WHERE date > NOW() - INTERVAL :dateFrom
          GROUP BY 1,2
        ) t2 ON (t1.id = t2.max_id and t1.coin_id = t2.coin_id)
        GROUP BY t1.coin_id
      )
      SELECT *, RANK() over (ORDER BY volume DESC)
      FROM records where volume > 1
    `
    result.daily = await Coin.query(`
      with list as (
        SELECT id, NULLIF((market_data->>'total_volume')::numeric, 0) volume FROM coins
      )
      SELECT id, volume, RANK() over (ORDER BY volume DESC) as rank
      FROM list WHERE volume > 1
    `)

    if (isFull) {
      result.weekly = await Coin.query(query, { dateFrom: '7 days' })
      result.monthly = await Coin.query(query, { dateFrom: '30 days' })
    }

    return result
  }

  async getDexVolumesRank(isFull) {
    console.log('Getting Dex Volumes Rank')
    const result = {
      daily: [],
      weekly: [],
      monthly: []
    }

    const query = `
      with records as (
        SELECT
          p.coin_id as id,
          SUM(v.volume) AS volume
        FROM platforms p
        LEFT JOIN dex_volumes v ON v.platform_id = p.id
        WHERE v.date > NOW() - INTERVAL '30 days'
        GROUP BY 1
      )
      SELECT *, RANK() over (ORDER BY volume DESC) as rank
      FROM records where volume > 1;
    `

    result.daily = await Coin.query(query, { dateFrom: '24 hours' })

    if (isFull) {
      result.weekly = await Coin.query(query, { dateFrom: '7 days' })
      result.monthly = await Coin.query(query, { dateFrom: '30 days' })
    }

    return result
  }

  async getTransactionRank(isFull) {
    console.log('Getting Transactions Rank')
    const result = {
      daily: [],
      weekly: [],
      monthly: []
    }

    const query = `
      with records as (
        SELECT
          p.coin_id as id,
          SUM(v.count) AS count,
          SUM(v.volume) AS volume
        FROM platforms p
        LEFT JOIN transactions v ON v.platform_id = p.id
        WHERE v.date > NOW() - INTERVAL :dateFrom
        GROUP BY 1
      )
      SELECT *, RANK() over (ORDER BY count DESC) rank
      FROM records where count > 0;
    `

    result.daily = await Coin.query(query, { dateFrom: '24 hours' })

    if (isFull) {
      result.weekly = await Coin.query(query, { dateFrom: '7 days' })
      result.monthly = await Coin.query(query, { dateFrom: '30 days' })
    }

    return result
  }

  async getDexLiquidityRank() {
    console.log('Getting Liquidity Rank')
    const query = `
      with liquidity as (
        SELECT t1.platform_id, t1.volume
        FROM dex_liquidities t1
        JOIN (
          SELECT platform_id, max(id) as max_id
          FROM dex_liquidities
          GROUP by 1
        ) t2 on t2.platform_id = t1.platform_id and t2.max_id = t1.id
      ),
      records as (
        SELECT
          p.coin_id as id, sum(l.volume) as volume
        FROM platforms p, liquidity l
        WHERE l.platform_id = p.id
        GROUP by 1
      )
      SELECT *, RANK() over (ORDER BY volume DESC)
      FROM records where volume > 1
    `

    return Coin.query(query)
  }

  async getTvlRank() {
    console.log('Getting TVL Rank')

    return Coin.query(`
      SELECT
        coin_id as id,
        tvl as volume,
        tvl_rank as rank 
      FROM defi_protocols
      WHERE tvl_rank IS NOT NULL
      ORDER by tvl_rank
    `)
  }

  async getAddressRank(isFull) {
    console.log('Getting Address Rank')
    const result = {
      daily: [],
      weekly: [],
      monthly: []
    }

    result.daily = await Coin.query(`
      with records as (
        SELECT
          distinct on (t1.platform_id)
          t1.platform_id,
          t1.date,
          (daily->>'count')::int as count
        FROM addresses t1, jsonb_array_elements(data->'24h') AS daily
        WHERE date >= date(now() - interval '1 day')
        ORDER BY 1,2 DESC
      ),
      records_by_coin as (
        SELECT
         p.coin_id as id,
         sum(r.count) as volume
        FROM records r, platforms p
        WHERE r.platform_id = p.id
        GROUP by 1
      )
      SELECT *, RANK() over (ORDER BY volume DESC) rank from records_by_coin
    `)

    if (isFull) {
      const ethPlatforms = await this.getPlatforms('ethereum')
      const ethAddresses = await dune.getMonthlyAddressStats(2032018, ethPlatforms.list)

      const bscPlatforms = await this.getPlatforms('binance-smart-chain')
      const bscAddresses = await dune.getMonthlyAddressStats(2035465, bscPlatforms.list)

      const { weekly, monthly } = this.mapCoinAddress(ethAddresses, bscAddresses, {
        ...ethPlatforms.map,
        ...bscPlatforms.map,
      })

      result.weekly = weekly
      result.monthly = monthly
    }

    return result
  }

  async getRevenue() {
    console.log('Getting Revenue Rank')
    const result = {
      daily: [],
      weekly: [],
      monthly: []
    }

    const map = {}
    const data = await tokenterminal.getProjects()
    const coins = await Coin.findAll({
      attributes: ['id', 'uid'],
      where: {
        uid: data.map(item => item.uid)
      }
    })

    for (let i = 0; i < coins.length; i += 1) {
      const coin = coins[i];
      map[coin.uid] = coin.id
    }

    result.daily = data.sort((a, b) => b.revenue['1d'] - a.revenue['1d'])
      .map((item, index) => ({
        id: map[item.uid],
        volume: item.revenue['1d'],
        rank: index + 1
      }))
      .filter(item => item.id && item.volume)

    result.weekly = data.sort((a, b) => b.revenue['7d'] - a.revenue['7d'])
      .map((item, index) => ({
        id: map[item.uid],
        volume: item.revenue['7d'],
        rank: index + 1
      }))
      .filter(item => item.id && item.volume)

    result.monthly = data.sort((a, b) => b.revenue['30d'] - a.revenue['30d'])
      .map((item, index) => ({
        id: map[item.uid],
        volume: item.revenue['30d'],
        rank: index + 1
      }))
      .filter(item => item.id && item.volume)

    return result
  }

  async getPlatforms(chain) {
    const platforms = await Platform.getByChain(chain, null, false)
    const map = {}
    const list = []

    platforms.forEach(({ type, address, coin_id: coinId }) => {
      if (type === 'native') {
        map[chain] = { coinId }
      }

      if (address) {
        list.push({ address })
        map[address] = { coinId }
      }
    })

    return { list, map }
  }

  mapCoinAddress(ethAddresses, bscAddresses, platforms) {
    const map = {}
    const set = (platform, data) => {
      if (!platform || !data) {
        return
      }

      const item = map[platform.coinId] || (map[platform.coinId] = {
        id: platform.coinId,
        week: 0,
        month: 0
      })

      if (data.period === 'week') {
        item.week += data.address_count
      }
      if (data.period === 'month') {
        item.month += data.address_count
      }
    }

    for (let i = 0; i < Math.max(ethAddresses.length, bscAddresses.length); i += 1) {
      const ethData = ethAddresses[i] || {}
      const ethPlatform = platforms[ethData.platform]

      const bscData = bscAddresses[i] || {}
      const bscPlatform = platforms[ethData.platform]

      set(ethPlatform, ethData)
      set(bscPlatform, bscData)
    }

    const coins = Object.values(map)
    const weekly = coins.sort((a, b) => b.week - a.week)
      .map((item, index) => ({
        id: item.id,
        volume: item.week,
        rank: index + 1
      }))

    const monthly = coins.sort((a, b) => b.month - a.month)
      .map((item, index) => ({
        id: item.id,
        volume: item.month,
        rank: index + 1
      }))

    return {
      weekly,
      monthly
    }
  }

  storeStats(map) {
    const records = Object.entries(map)
      .map(([coinId, rank]) => {
        return {
          coin_id: parseInt(coinId, 10),
          rank
        }
      })

    return CoinStats.bulkCreate(records, { updateOnDuplicate: ['rank'] })
      .then(recs => {
        console.log('Upserted stats', recs.length)
      })
      .catch(e => {
        console.log(e)
      })
  }
}

module.exports = CoinRankSyncer
