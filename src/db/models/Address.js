const SequelizeModel = require('./SequelizeModel')
const Platform = require('./Platform')

class Address extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        data: DataTypes.JSONB,
        // { "30m":[
        //     {
        //       "date": "2022-02-01",
        //       "count": 10
        //     },
        //     {
        //       "date": "2022-02-02",
        //       "count": 20
        //     }
        // ]}
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
      SELECT  items->'date' AS date,
              items->'count' AS count
      FROM addresses A,
           jsonb_array_elements(data->'${window}') AS items
      WHERE
          A.platform_id = :platform_id AND
          A.date >= :dateFrom
    `

    return Address.query(query, { dateFrom, platform_id: platform.id })
  }

  static deleteExpired(dateFrom, dateTo, periods) {
    return Address.query(`
      UPDATE addresses
      SET data = data - ARRAY[:periods]
      WHERE date >= :dateFrom AND date < :dateTo`, {
      dateFrom,
      dateTo,
      periods
    })
  }

}

module.exports = Address
