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
    // const holdersRank = await this.getHoldersRank()
    const defiTvlRank = await this.getTvlRank()

    const coins = await Coin.query('select id from coins')
    const coinMap = coins.reduce((res, coin) => ({ ...res, [coin.id]: {} }), {})

    const mapRank = (items, type, ratings) => {
      const percent = Object.entries(ratings)
        .reduce((res, [rating, percentage]) => ({
          ...res, [rating]: (items.length * percentage) / 100
        }), {})

      items.forEach((item, i) => {
        const coin = coinMap[item.id] || {}
        const rank = i + 1

        coin[`${type}_rank`] = rank
        coin[`${type}_percent`] = (rank / items.length) * 100
        coin[`${type}_value`] = item[type]

        if (rank <= percent.a) {
          coin[`${type}_rating`] = 'a'
        } else if (rank <= percent.b) {
          coin[`${type}_rating`] = 'b'
        } else if (rank <= percent.c) {
          coin[`${type}_rating`] = 'c'
        } else {
          coin[`${type}_rating`] = 'd'
        }
      })
    }

    mapRank(revenueRank, 'revenue', { a: 20, b: 30, c: 40, d: 100 })
    mapRank(volumesRank, 'volumes', { a: 3.11, b: 7, c: 10, d: 100 })
    // mapRank(holdersRank, 'holders', { a: 2, b: 7, c: 10, d: 100 })
    mapRank(addressRank, 'address', { a: 1.2, b: 3, c: 6, d: 100 })
    mapRank(defiTvlRank, 'tvl', { a: 4, b: 8, c: 20, d: 100 })

    const records = Object.entries(coinMap)
      .map(([id, stats]) => {
        return [
          parseInt(id, 10),
          JSON.stringify(stats)
        ]
      })

    console.log('Updated coin stats', records.length)
    await Coin.updateStats(records)
  }

  async getRevenueRank() {
    const revenue = await tokenTerminal.getProjects()

    return Coin.query(`
      SELECT
        c.id,
        v.revenue
      FROM (values :revenue) as v(id, revenue), coins c
      WHERE c.coingecko_id = v.id
        AND v.revenue IS NOT NULL
      ORDER BY v.revenue desc
    `, { revenue })
  }

  getVolumesRank(dateFrom) {
    return Coin.query(`
      SELECT
        c.id,
        SUM(m.volume_usd) AS volumes
      FROM coins c
      JOIN (
        SELECT
          m.*
        FROM coin_markets m, exchanges e
        WHERE e.uid = m.market_uid
      ) m ON c.id = m.coin_id
      GROUP BY c.id
      ORDER BY volumes DESC
    `, { dateFrom })
  }

  getAddressRank(dateFrom) {
    return Coin.query(`
      with records as (
        SELECT
          c.id,
          jsonb_array_elements(a.data->'1d')->'count' as address_count
        FROM addresses a, platforms p, coins c
        WHERE a.date >= :dateFrom
          AND p.id = a.platform_id
          AND c.id = p.coin_id
          AND (c.market_data->>'market_cap')::numeric > 500000
      )
      SELECT
        id,
        sum(address_count::numeric) as address
      FROM records
      GROUP BY id
      ORDER BY address desc
    `, { dateFrom })
  }

  getHoldersRank() {
    return Coin.query(`
      with top_holders as (
        SELECT
          p.coin_id,
          SUM(h.percentage) as holders,
          ROW_NUMBER() OVER(
            PARTITION BY p.coin_id
            ORDER BY case
              WHEN p.type = 'erc20' then 1
              WHEN p.type = 'bep20' then 2
              ELSE 3
            END ASC
          ) AS row_num
        FROM coin_holders h, coins c, platforms p
        WHERE p.id = h.platform_id
          AND c.id = p.coin_id
          AND (c.market_data->>'market_cap')::numeric > 7790000
        GROUP BY p.type, p.coin_id
      )
      SELECT
        c.id,
        h.holders
      FROM top_holders h, coins c
      WHERE c.id = h.coin_id
        AND h.row_num = 1
      ORDER BY holders asc
    `)
  }

  getTvlRank() {
    return Coin.query(`
      SELECT
        c.id,
        p.tvl
      FROM defi_protocols p, coins c
      WHERE c.id = p.coin_id
        AND p.tvl_rank IS NOT NULL
      ORDER BY tvl_rank
    `)
  }
}

module.exports = CoinRatingSyncer
