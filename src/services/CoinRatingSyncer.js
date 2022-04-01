const Syncer = require('./Syncer')
const Coin = require('../db/models/Coin')
const tokenTerminal = require('../providers/tokenterminal')
const { utcDate } = require('../utils')

class CoinRatingSyncer extends Syncer {
  async start() {
    await this.sync()
    await this.syncPeriodically()
  }

  syncPeriodically() {
    this.cron('1d', this.sync)
  }

  async sync() {
    const dateFrom = utcDate({ month: -1 }, 'yyyy-MM-dd')

    const revenueRank = await this.getRevenueRank()
    const volumesRank = await this.getVolumesRank(dateFrom)
    const addressRank = await this.getAddressRank(dateFrom)
    const holdersRank = await this.getHoldersRank()
    const tvlRank = await this.getTvlRank()

    const coins = await Coin.query('select c.id from coins c, coin_categories g where c.id = g.coin_id')
    const coinMap = coins.reduce((res, coin) => ({ ...res, [coin.id]: {} }), {})
    const mapRank = (items, type) => {
      items.forEach((item, i) => {
        const coin = coinMap[item.id] || {}

        switch (type) {
          case 'tvlRank':
            coin.tvlRank = i + 1
            coin.tvlRatio = item.ratio
            break
          case 'volumesRank':
            coin.volumeRank = item.rank
            coin.volumeRatio = item.ratio
            break
          case 'revenueRank':
          case 'addressRank':
          case 'holdersRank':
            coin[type] = i + 1
            break
          default:
        }
      })
    }

    mapRank(revenueRank, 'revenueRank')
    mapRank(volumesRank, 'volumesRank')
    mapRank(holdersRank, 'holdersRank')
    mapRank(addressRank, 'addressRank')
    mapRank(tvlRank, 'tvlRank')

    const records = Object.entries(coinMap)
      .map(([id, stats]) => {
        return [
          parseInt(id, 10),
          JSON.stringify(stats)
        ]
      })

    console.log('Updates coin stats', records.length)

    await Coin.updateStats(records)
  }

  async getRevenueRank() {
    const revenue = await tokenTerminal.getProjects()

    return Coin.query(`
      with coins as (
        select
          c.id,
          c.coingecko_id
        from coins c, coin_categories g
        where c.id = g.coin_id
      )
      select
        c.id,
        v.revenue
      from (values :revenue) as v(id, revenue), coins c
      where c.coingecko_id = v.id
      order by v.revenue desc nulls last
    `, { revenue })
  }

  getVolumesRank(dateFrom) {
    return Coin.query(`
      with coins as (
        select
          c.id,
          nullif((c.market_data->'market_cap')::numeric, 0) as mcap
        from coins c, coin_categories g
        where c.id = g.coin_id
      )
      select
        c.id,
        p.volume_avg as volume,
        p.volume_avg / c.mcap as ratio,
        rank() over (order by p.volume_avg desc) as rank
      from (
        SELECT
          coin_id,
          avg(volume) volume_avg
        FROM coin_prices
        WHERE date >= :dateFrom
        GROUP BY coin_id
      ) p
      join coins c on c.id = p.coin_id
      order by ratio desc nulls last
    `, { dateFrom })
  }

  getAddressRank(dateFrom) {
    return Coin.query(`
      with coins as (
        select
          c.id
        from coins c, coin_categories g
        where c.id = g.coin_id
      )
      SELECT
        C.id,
        SUM(a.count) uniq_address
      FROM addresses a, platforms p, coins c
      where a.date >= :dateFrom
        and p.id = a.platform_id
        and c.id = p.coin_id
      GROUP by c.id
      order by uniq_address desc
    `, { dateFrom })
  }

  getHoldersRank() {
    return Coin.query(`
      with coins as (
        select
          c.id
        from coins c, coin_categories g
        where c.id = g.coin_id
      )
      select
        c.id,
        sum(h.percentage) as percentage
      from coin_holders h, platforms p, coins c
      where p.id = h.platform_id
        and c.id = p.coin_id
      group by c.id
      order by percentage asc
    `)
  }

  getTvlRank() {
    return Coin.query(`
      with coins as (
        select
          c.id,
          nullif((c.market_data->'market_cap')::numeric, 0) as mcap
        from coins c, coin_categories g
        where c.id = g.coin_id
      )
      select
        c.id,
        p.tvl_rank,
        p.tvl / c.mcap as ratio
      from defi_protocols p, coins c
      where c.id = p.coin_id
      order by ratio desc nulls last
    `)
  }
}

module.exports = CoinRatingSyncer
