const utils = require('../../utils')
const SequelizeModel = require('./SequelizeModel')

class GlobalMarket extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        date: {
          type: DataTypes.DATE,
          allowNull: false,
          unique: true
        },
        market_cap: {
          type: DataTypes.DECIMAL,
          defaultValue: 0,
          allowNull: false
        },
        defi_market_cap: {
          type: DataTypes.DECIMAL,
          defaultValue: 0,
          allowNull: false
        },
        volume: {
          type: DataTypes.DECIMAL,
          defaultValue: 0,
          allowNull: false
        },
        btc_dominance: {
          type: DataTypes.DECIMAL,
          defaultValue: 0,
          allowNull: false
        },
        tvl: {
          type: DataTypes.DECIMAL,
          defaultValue: 0,
          allowNull: false
        },
        chain_tvls: {
          type: DataTypes.JSONB
        }
      },
      {
        sequelize,
        tableName: 'global_markets'
      }
    )
  }

  static deleteExpired(dateFrom, dateTo) {
    return GlobalMarket.query('DELETE FROM global_markets WHERE date > :dateFrom AND date < :dateTo', {
      dateFrom,
      dateTo
    })
  }

  static async getOverview(dateFrom) {
    const result = {}

    const [yesterday] = await GlobalMarket.query(`
      select market_cap, btc_dominance, defi_market_cap, tvl, volume
        from global_markets
       where date <= :dateFrom
       order by date desc
       limit 1
    `, { dateFrom })

    const [today] = await GlobalMarket.query(`
      select market_cap, btc_dominance, defi_market_cap, tvl, volume
        from global_markets
       order by date desc
       limit 1
    `)

    result.market_cap = today.market_cap
    result.market_cap_change = utils.percentageChange(yesterday.market_cap, today.market_cap)
    result.btc_dominance = today.btc_dominance
    result.btc_dominance_change = utils.percentageChange(yesterday.btc_dominance, today.btc_dominance)
    result.defi_market_cap = today.defi_market_cap
    result.defi_market_cap_change = utils.percentageChange(yesterday.defi_market_cap, today.defi_market_cap)
    result.tvl = today.tvl
    result.tvl_change = utils.percentageChange(yesterday.tvl, today.tvl)
    result.volume = today.volume
    result.volume_change = utils.percentageChange(yesterday.volume, today.volume)

    const [etf] = await GlobalMarket.query(`
      select total_inflow, total_daily_inflow
        from etf_total_inflow
        order by date desc
        limit 1
    `)

    result.etf_total_inflow = etf.total_inflow
    result.etf_daily_inflow = etf.total_daily_inflow

    return result
  }

  static getList(dateFrom, window) {
    const query = (`
      SELECT
        t2.time AS date,
        t1.market_cap,
        t1.defi_market_cap,
        t1.volume,
        t1.btc_dominance,
        t1.tvl
      FROM global_markets t1
      JOIN (
        SELECT
          ${this.truncateDateWindow('date', window)} as time,
          max(id) as max_id,
          max(date) as max_date
         FROM global_markets
        WHERE date >= :dateFrom
        GROUP by time
      ) t2 ON (t1.id = t2.max_id AND t1.date = t2.max_date)
      ORDER BY date
    `)

    return GlobalMarket.query(query, { dateFrom })
  }

  static getTvls(chain, dateFrom, window) {
    const field = chain ? `t1.chain_tvls->'${chain}'` : 'tvl'
    const query = (`
      SELECT
        t2.time AS date,
        ${field} as tvl
      FROM global_markets t1
      JOIN (
        SELECT
          ${this.truncateDateWindow('date', window)} as time,
          max(id) as max_id,
          max(date) as max_date
         FROM global_markets
        WHERE date >= :dateFrom
        GROUP by time
      ) t2 ON (t1.id = t2.max_id AND t1.date = t2.max_date)
      ORDER BY date
    `)

    return GlobalMarket.query(query, { chain, dateFrom })
  }

  static async exists() {
    return !!await GlobalMarket.findOne()
  }
}

module.exports = GlobalMarket
