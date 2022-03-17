const SequelizeModel = require('./SequelizeModel')
const Platform = require('./Platform')

class Address extends SequelizeModel {

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
        tableName: 'addresses',
        indexes: [{
          unique: true,
          fields: ['date', 'platform_id']
        }]
      }
    )
  }

  static associate(models) {
    Address.belongsTo(models.Platform, {
      foreignKey: 'platform_id'
    })
  }

  static async exists() {
    return !!await Address.findOne()
  }

  static async existsForPlatforms(platforms) {
    const query = `
      SELECT COUNT(*)
      FROM addresses a , platforms p
      WHERE a.platform_id = p.id AND p.type IN (:platforms)
    `
    const [result] = await Address.query(query, { platforms })
    return result.count > 0
  }

  static async getByCoinUid(uid, platformType, window, dateFrom) {
    const [platform] = await Platform.findByCoinUID(uid, platformType)
    if (!platform) {
      return []
    }

    const query = `
      SELECT
        ${this.truncateDateWindow('date', window)} as date,
        SUM(count) AS count,
        SUM(volume) AS volume
      FROM addresses
      WHERE platform_id = :platform_id
        and date >= :dateFrom
      GROUP by 1
      ORDER BY date ASC
    `

    return Address.query(query, { dateFrom, platform_id: platform.id })
  }

  static updatePoints(dateFrom, dateTo) {
    const query = `
      UPDATE addresses
      SET volume = total.volume, count = total.count
      FROM (
        SELECT
          SUM(volume) as volume,  SUM(count) as count
          FROM addresses
          WHERE date > :dateFrom AND date <= :dateTo
        ) AS total
      WHERE date = :dateTo
    `

    return Address.query(query, { dateFrom, dateTo })
  }

  static deleteExpired(dateFrom, dateTo) {
    return Address.query('DELETE FROM addresses WHERE date > :dateFrom AND date < :dateTo', {
      dateFrom,
      dateTo
    })
  }

}

module.exports = Address
