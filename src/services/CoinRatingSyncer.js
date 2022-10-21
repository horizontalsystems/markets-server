const { chunk } = require('lodash')
const { utcDate } = require('../utils')
const Syncer = require('./Syncer')
const Coin = require('../db/models/Coin')
const tokenTerminal = require('../providers/tokenterminal')

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
    const volumesRank = await this.getVolumesRank()
    const addressRank = await this.getAddressRank(dateFrom)
    const defiTvlRank = await this.getTvlRank()
    const transactionRank = await this.getTxCountRank(dateFrom)

    const coins = await Coin.query('SELECT id, market_data->\'market_cap\' mcap FROM coins ORDER BY mcap DESC NULLS LAST LIMIT 500')
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

    mapRank(revenueRank, 'revenue', { a: 10, b: 30, c: 60, d: 100 }) // { a: 20, b: 30, c: 40, d: 100
    mapRank(volumesRank, 'volumes', { a: 10, b: 30, c: 60, d: 100 }) // { a: 3.11, b: 7, c: 10, d: 100
    mapRank(addressRank, 'address', { a: 10, b: 30, c: 60, d: 100 }) // { a: 1.2, b: 3, c: 6, d: 100
    mapRank(defiTvlRank, 'tvl', { a: 10, b: 30, c: 60, d: 100 }) //     { a: 4, b: 8, c: 20, d: 100
    mapRank(transactionRank, 'tx', { a: 10, b: 30, c: 60, d: 100 }) //  { a: 2, b: 7, c: 10, d: 100

    const records = Object.entries(coinMap)
      .map(([id, stats]) => {
        const ratings = stats
        const ratingsTotal = this.rating([
          stats.tx_rating,
          stats.tvl_rating,
          stats.revenue_rating,
          stats.volumes_rating,
          stats.address_rating
        ])

        if (ratingsTotal) {
          ratings.total_rating = ratingsTotal
        }

        return [parseInt(id, 10), JSON.stringify(ratings)]
      })

    const chunks = chunk(records, 1000)

    for (let i = 0; i < chunks.length; i += 1) {
      await Coin.updateStats(chunks[i]).catch(e => console.error(e))
    }

    console.log(`Updated coin stats ${records.length}`)
  }

  async getRevenueRank() {
    const revenue = await tokenTerminal.getProjects()

    return Coin.query(`
      with topcoins as (${this.getTopCoins()})
      SELECT
        c.id,
        v.revenue
      FROM (values :revenue) as v(id, revenue), topcoins c
      WHERE c.coingecko_id = v.id
        AND v.revenue IS NOT NULL
      ORDER BY v.revenue desc
    `, { revenue })
  }

  getVolumesRank() {
    return Coin.query(`
      with topcoins as (${this.getTopCoins()})
      SELECT
        c.id,
        SUM(m.volume_usd) AS volumes
      FROM topcoins c
      JOIN (
        SELECT
          m.*
        FROM coin_markets m, exchanges e
        WHERE e.uid = m.market_uid
      ) m ON c.id = m.coin_id
      GROUP BY c.id
      ORDER BY volumes DESC
    `)
  }

  getAddressRank(dateFrom) {
    return Coin.query(`
      with topcoins as (${this.getTopCoins()}),
      records as (
        SELECT
          c.id,
          jsonb_array_elements(a.data->'1d')->'count' as address_count
        FROM addresses a, platforms p, topcoins c
        WHERE a.date >= :dateFrom
          AND p.id = a.platform_id
          AND c.id = p.coin_id
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
      with topcoins as (${this.getTopCoins()}),
      top_holders as (
        SELECT
          p.coin_id,
          SUM(h.percentage) as holders,
          ROW_NUMBER() OVER(
            PARTITION BY p.coin_id
            ORDER BY case
              WHEN p.chain_uid = 'ethereum' then 1
              WHEN p.chain_uid = 'binance-smart-chain' then 2
              ELSE 3
            END ASC
          ) AS row_num
        FROM coin_holders h, topcoins c, platforms p
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
      with topcoins as (${this.getTopCoins()})
      SELECT
        c.id,
        p.tvl
      FROM defi_protocols p, topcoins c
      WHERE c.id = p.coin_id
        AND p.tvl_rank IS NOT NULL
        AND p.tvl > 0
      ORDER BY tvl_rank
    `)
  }

  getTxCountRank(dateFrom) {
    return Coin.query(`
      with topcoins as (${this.getTopCoins()})
      SELECT
        c.id,
        sum(t.count) tx
      FROM transactions t, topcoins c, platforms p
        WHERE p.id = t.platform_id
          AND c.id = p.coin_id
          AND t.date >= :dateFrom
      GROUP BY 1
      ORDER BY tx DESC
    `, { dateFrom })
  }

  getTopCoins() {
    return (`
      SELECT
        id,
        uid,
        coingecko_id,
        NULLIF((market_data->>'market_cap')::numeric, 0) mcap
      FROM coins
      WHERE coingecko_id IS NOT NULL
      ORDER BY mcap DESC NULLS LAST LIMIT 500
    `)
  }

  weight(label) {
    switch (label) {
      case 'a':
        return 3
      case 'b':
        return 2
      case 'c':
        return 1
      default:
        return 0
    }
  }

  rating(ratings) {
    const map = { a: 0, b: 0, c: 0, d: 0 }

    for (let i = 0; i < ratings.length; i += 1) {
      const rating = ratings[i]
      map[rating] = (map[rating] || 0) + 1
    }

    if (map.a >= 3) {
      if (map.c || map.d) {
        return 'b'
      }

      return 'a'
    }
    if (map.a >= 2) {
      return 'b'
    }

    if (map.b >= 3) {
      if (map.c || map.d) {
        return 'c'
      }

      return 'b'
    }

    if (map.c >= 3) {
      if (map.d) {
        return 'd'
      }

      return 'c'
    }

    return map.d ? 'd' : null
  }

  ratingByPercent(points) {
    const percentage = (points * 100) / 12

    if (percentage >= 90) {
      return 'a'
    }
    if (percentage >= 80) {
      return 'b'
    }
    if (percentage >= 60) {
      return 'c'
    }

    return 'd'
  }
}

module.exports = CoinRatingSyncer
