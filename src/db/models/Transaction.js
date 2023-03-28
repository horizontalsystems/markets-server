const SequelizeModel = require('./SequelizeModel')
const Platform = require('./Platform')

class Transaction extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        count: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
        volume: {
          type: DataTypes.DECIMAL,
          allowNull: false
        },
        date: {
          type: DataTypes.DATE,
          allowNull: false
        }
      },
      {
        sequelize,
        tableName: 'transactions',
        indexes: [{
          unique: true,
          fields: ['date', 'platform_id']
        }]
      }
    )
  }

  static associate(models) {
    Transaction.belongsTo(models.Platform, {
      foreignKey: 'platform_id'
    })
  }

  static async exists() {
    return !!await Transaction.findOne()
  }

  static async existsForPlatforms(chain) {
    const query = `
      SELECT COUNT(*)
      FROM transactions t , platforms p
      WHERE t.platform_id = p.id
        AND p.chain_uid = :chain
    `
    const [result] = await Transaction.query(query, { chain })
    return result.count > 0
  }

  static async getByCoin(uid, chain, window, dateFrom, dateTo) {
    const platforms = await Platform.findByCoinUID(uid, chain)
    if (!platforms.length) {
      return {}
    }

    const query = `
      SELECT
        ${this.truncateDateWindow('date', window)} as date,
        SUM(count) AS count,
        SUM(volume) AS volume,
        ARRAY_AGG(distinct platform_id) as platforms
      FROM transactions
      WHERE platform_id IN(:platformIds)
        AND date >= :dateFrom
        AND date < :dateTo
      GROUP by 1
      ORDER by date
    `

    const transactions = await Transaction.query(query, {
      dateFrom,
      dateTo,
      platformIds: platforms.map(item => item.id)
    })

    return { transactions, platforms }
  }

  static async getByPlatform(platformIds, window, dateFrom, dateFromInt, dateTo, withVolume) {
    const query = `
      with recs as (
        SELECT
          ${this.truncateDateWindow('date', window)} as timestamp,
          SUM (count)::int AS count
          ${withVolume ? ', SUM (volume) AS volume' : ''}
        FROM transactions
        WHERE platform_id IN(:platformIds)
          AND date >= :dateFrom
          AND date < :dateTo
        GROUP by 1
        ORDER by timestamp
      )
      SELECT *, count::text AS count FROM recs WHERE timestamp >= :dateFromInt
    `

    return Transaction.query(query, { dateFrom, dateFromInt, dateTo, platformIds })
  }

  static getSummedItems(dateFrom, platformIds) {
    const query = `
      SELECT
        sum(count) count,
        sum(volume) volume,
        platform_id
      FROM transactions
      WHERE date >= :dateFrom
        AND platform_id IN (:platformIds)
      GROUP BY platform_id
    `

    return Transaction.query(query, {
      dateFrom,
      platformIds
    })
  }

  static updatePoints(dateFrom, dateTo) {
    const query = `
      UPDATE transactions as t SET
        count = total.count,
        volume = total.volume
      FROM (
        SELECT
          platform_id,
          SUM(volume) as volume,
          SUM(count) as count
        FROM transactions
        WHERE date >= :dateFrom
          AND date < :dateTo
        GROUP BY platform_id
      ) AS total
      WHERE t.date = :dateFrom
        AND t.platform_id = total.platform_id
    `

    return Transaction.queryUpdate(query, { dateFrom, dateTo })
  }

  static deleteExpired(dateFrom, dateTo) {
    return Transaction.query('DELETE FROM transactions WHERE date > :dateFrom AND date < :dateTo', {
      dateFrom,
      dateTo
    })
  }

}

module.exports = Transaction
