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

  static async getByCoin(uid, platform, window, dateFrom) {
    const platforms = await Platform.findByCoinUID(uid, platform)
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
      GROUP by 1
      ORDER by date
    `

    const transactions = await Transaction.query(query, {
      dateFrom,
      platformIds: platforms.map(item => item.id)
    })

    return { transactions, platforms }
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
    return Transaction.query(`
      UPDATE transactions
      SET volume = total.volume,
          count = total.count
      FROM (SELECT 
            SUM(volume) as volume,  SUM(count) as count
            FROM transactions
            WHERE date > :dateFrom AND date <= :dateTo
           ) AS total
      WHERE date = :dateTo`, {
      dateFrom,
      dateTo
    })
  }

  static deleteExpired(dateFrom, dateTo) {
    return Transaction.query('DELETE FROM transactions WHERE date > :dateFrom AND date < :dateTo', {
      dateFrom,
      dateTo
    })
  }

}

module.exports = Transaction
