const Syncer = require('./Syncer')
const Coin = require('../db/models/Coin')
const CoinStats = require('../db/models/CoinStats')
const Platform = require('../db/models/Platform')
const tokenterminal = require('../providers/tokenterminal')
const flipsidecrypto = require('../providers/flipsidecrypto')
const dune = require('../providers/dune')
const { stringToHex } = require('../utils')

class CoinRankSyncer extends Syncer {
  async start(force) {
    if (force) {
      return this.syncForce(true)
    }

    this.cron('0 1-23 * * *', () => this.sync())
    this.cron('1h', () => this.syncRestStats())
    this.cron('1d', () => this.sync(true))
  }

  async syncForce(isFull) {
    console.log('Force sync ranks', isFull)
    await this.sync(isFull)
    await this.syncRestStats()
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
      if (!isFull) {
        pickIfExists(item, rank, [
          // 'tvl_rank',
          'tvl',
          // 'liquidity_rank',
          'liquidity',
          // 'tx_day',
          // 'tx_day_rank',
          // 'tx_day_count',
          'tx_week',
          'tx_week_rank',
          'tx_week_count',
          'tx_month',
          'tx_month_rank',
          'tx_month_count',
          // 'cex_volume_day',
          // 'cex_volume_day_rank',
          'cex_volume_week',
          'cex_volume_week_rank',
          'cex_volume_month',
          'cex_volume_month_rank',
          // 'dex_volume_day',
          // 'dex_volume_day_rank',
          'dex_volume_week',
          'dex_volume_week_rank',
          'dex_volume_month',
          'dex_volume_month_rank',
          // 'address_day',
          // 'address_day_rank',
          'address_week',
          'address_week_rank',
          'address_month',
          'address_month_rank',
          // 'revenue_day',
          // 'revenue_day_rank',
          'revenue_week',
          'revenue_week_rank',
          'revenue_month',
          'revenue_month_rank'
        ])
      }

      if (coinId) {
        map[coinId] = item
      }
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
      if (!record || !record.id || !record.volume || !record.rank) {
        return
      }

      const item = {
        ...map[record.id],
        [key]: String(record.volume),
        [`${key}_rank`]: String(record.rank)
      }

      if (isTx && record.count) {
        item[`${key}_count`] = record.count
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
            AND coin_id != 11644 --// binance-peg-ethereum
          GROUP BY 1,2
        ) t2 ON (t1.id = t2.max_id and t1.coin_id = t2.coin_id)
        GROUP BY t1.coin_id
      )
      SELECT *, ROW_NUMBER() over (ORDER BY volume DESC) as rank
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
      with platforms as (
        SELECT c.id as coin_id, p.id
        FROM platforms p, coins c
        WHERE c.id = p.coin_id
        AND ((c.market_data->>'market_cap')::numeric > 1000000 or (c.market_data->>'total_volume')::numeric > 100000)
      ),
      records as (
        SELECT p.coin_id AS id, SUM(v.volume) AS volume
        FROM platforms p
        LEFT JOIN dex_volumes v ON v.platform_id = p.id
        WHERE v.date > NOW() - INTERVAL :dateFrom
        GROUP BY 1
      )
      SELECT *, RANK() over (ORDER BY volume DESC) as rank
      FROM records where volume > 0
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
      with platforms as (
        SELECT c.id as coin_id, p.id
        FROM platforms p, coins c
        WHERE c.id = p.coin_id
        AND ((c.market_data->>'market_cap')::numeric > 1000000 or (c.market_data->>'total_volume')::numeric > 100000)
      ),
      records as (
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
      with top_platforms as (
        SELECT p.coin_id, p.id
        FROM platforms p, coins c
        WHERE c.id = p.coin_id
        AND ((c.market_data->>'market_cap')::numeric > 1000000 or (c.market_data->>'total_volume')::numeric > 100000)
      ),
      liquidity as (
        SELECT
          DISTINCT ON(l.exchange, l.platform_id) l.exchange, l.platform_id, l.date, l.volume, p.coin_id 
        FROM dex_liquidities l, top_platforms p 
        WHERE platform_id = p.id
          AND volume > 0
          AND date >= NOW() - interval '3 days'
          ORDER BY exchange, platform_id, date desc
      ),
      records as (
        SELECT
          coin_id as id, sum(volume) as volume
        FROM liquidity
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
      with top_platforms as (
        SELECT p.id, p.coin_id, p.type, p.address
        FROM platforms p, coins c
        WHERE c.id = p.coin_id
        AND ((c.market_data->>'market_cap')::numeric > 1000000 or (c.market_data->>'total_volume')::numeric > 100000)
      ),
      records as (
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
        FROM records r, top_platforms p
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
      const bnbAddresses = await flipsidecrypto.getBnbActiveStats()

      const { weekly, monthly } = this.mapCoinAddress(
        ethAddresses,
        bscAddresses,
        bnbAddresses,
        ethPlatforms.map,
        bscPlatforms.map
      )

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
    const map = {}
    const list = []
    const platforms = await Platform.query(`
      SELECT p.id, p.coin_id, p.type, p.address
      FROM platforms p, coins c
      WHERE c.id = p.coin_id
        AND ((c.market_data->>'market_cap')::numeric > 1000000 or (c.market_data->>'total_volume')::numeric > 100000)
        AND p.chain_uid = :chain
    `, { chain })

    platforms.forEach(({ type, address, coin_id: coinId }) => {
      if (type === 'native') {
        map[chain] = { coinId }
        map[stringToHex(chain)] = { coinId }
      }

      if (address && address.startsWith('0x')) {
        list.push({ address })
        map[address] = { coinId }
      }
    })

    return { list, map }
  }

  mapCoinAddress(ethAddresses, bscAddresses, bnbAddresses, ethPlatforms, bscPlatforms) {
    const map = {}
    const set = (platform, data) => {
      if (!platform) {
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

    for (let i = 0; i < Math.max(ethAddresses.length, bscAddresses.length, bnbAddresses.length); i += 1) {
      const ethData = ethAddresses[i]
      if (ethData) {
        set(ethPlatforms[ethData.platform], ethData)
      }

      const bscData = bscAddresses[i]
      if (bscData) {
        set(bscPlatforms[bscData.platform], bscData)
      }

      const bnbData = bnbAddresses[i]
      if (bnbData) {
        set(bscPlatforms[bnbData.platform], bnbData)
      }
    }

    const coins = Object.values(map)
    const weekly = coins.sort((a, b) => parseFloat(b.week) - parseFloat(a.week))
      .map((item, index) => ({
        id: item.id,
        volume: item.week,
        rank: index + 1
      }))

    const monthly = coins.sort((a, b) => parseFloat(b.month) - parseFloat(a.month))
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
    const records = []
    const entries = Object.entries(map)

    for (let i = 0; i < entries.length; i += 1) {
      const [coinId, rank] = entries[i];
      if (coinId && rank) {
        records.push({ rank, coin_id: parseInt(coinId, 10) })
      }
    }

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
