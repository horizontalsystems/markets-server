const Sequelize = require('sequelize')
const SequelizeModel = require('./SequelizeModel')
const Chain = require('./Chain')

class ChainMarketCap extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        market_cap: {
          type: DataTypes.DECIMAL,
          allowNull: false
        },
        date: {
          type: DataTypes.DATE,
          allowNull: false
        },
        chain_uid: {
          type: DataTypes.STRING(50),
          allowNull: false,
          references: {
            key: 'uid',
            model: Chain,
            deferrable: Sequelize.Deferrable.INITIALLY_IMMEDIATE
          }
        }
      },
      {
        sequelize,
        tableName: 'chain_market_caps',
        indexes: [{
          unique: true,
          fields: ['date', 'chain_uid']
        }]
      }
    )
  }

  static async exists() {
    return !!await ChainMarketCap.findOne()
  }

  static getByDate(date) {
    const query = `
      SELECT
        *,
        RANK() over (ORDER BY market_cap DESC) as ranked
      FROM chain_market_caps
      WHERE date = :date
      ORDER BY market_cap DESC
    `
    return ChainMarketCap.query(query, { date })
  }

  static getByPlatform(chain, dateFrom, window) {
    const query = `
      SELECT
        t2.time AS timestamp,
        t1.market_cap
      FROM chain_market_caps t1
      JOIN (
        SELECT
          ${this.truncateDateWindow('date', window)} as time,
          max(id) as max_id,
          max(date) as max_date,
          chain_uid
         FROM chain_market_caps
        WHERE date >= :dateFrom
          AND chain_uid = :chain
        GROUP by time, chain_uid
      ) t2 ON (t1.id = t2.max_id AND t1.date = t2.max_date)
      ORDER BY date
    `

    return ChainMarketCap.query(query, { dateFrom, chain })
  }

  static getMarketChart(chain, dateFrom, window) {
    const query = `
      SELECT
        t2.time AS timestamp,
        t1.market_cap
      FROM chain_market_caps t1
      JOIN (
        SELECT
          ${this.truncateDateWindow('date', window)} as time,
          max(id) as max_id,
          max(date) as max_date,
          chain_uid
         FROM chain_market_caps
        WHERE chain_uid = :chain
          ${dateFrom ? 'AND EXTRACT(epoch from date) >= :dateFrom' : ''}
        GROUP by time, chain_uid
      ) t2 ON (t1.id = t2.max_id AND t1.date = t2.max_date)
      ORDER BY date
    `

    return ChainMarketCap.query(query, { dateFrom, chain })
  }

  static async getFirstPoint(uid) {
    const [price] = await ChainMarketCap.query(`
      SELECT EXTRACT(epoch FROM date)::int AS timestamp
      FROM chain_market_caps
      WHERE chain_uid = :uid
      ORDER BY date ASC
      limit 1`, { uid })

    return price
  }

  static deleteExpired(dateFrom, dateTo) {
    return ChainMarketCap.query('DELETE FROM chain_market_caps WHERE date > :dateFrom AND date < :dateTo', {
      dateFrom,
      dateTo
    })
  }
}

module.exports = ChainMarketCap
