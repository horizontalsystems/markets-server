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

  static getList(dateFrom, window) {
    const query = (`
      SELECT
        EXTRACT(epoch FROM t2.time)::int AS date,
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
    const query = (`
      SELECT
        EXTRACT(epoch FROM t2.time)::int AS date,
        t1.chain_tvls->:chain as tvl
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
