const SequelizeModel = require('./SequelizeModel')
const Platform = require('./Platform')

class Address extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        data: DataTypes.JSONB,
        // {
        //   "30m":[{
        //     "date": "2022-02-01T00:30:00",
        //     "count": 10
        //   }],
        //   "4h":[{
        //     "date": "2022-02-01T04:00:00",
        //     "count": 10
        //   }],
        //   "8h":[{...}],
        //   "1d":[{...}]
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

  static async existsForPlatforms(chain) {
    const query = `
      SELECT
        COUNT(*)
      FROM addresses a, platforms p
      WHERE a.platform_id = p.id
        AND p.chain_uid = :chain
    `

    const [result] = await Address.query(query, { chain })
    return result.count > 0
  }

  static async getByCoinUid(uid, platform, period, dateFrom, dateTo) {
    const platforms = await Platform.findByCoinUID(uid, platform)
    if (!platforms.length) {
      return {}
    }

    const query = (`
      SELECT
        EXTRACT (epoch from (items->>'date')::timestamp)::int AS timestamp,
        ARRAY_AGG (distinct platform_id) as platforms,
        SUM ((items->>'count')::int) AS count
      FROM addresses A, jsonb_array_elements(data->'${period}') AS items
      WHERE A.platform_id in (:platforms)
        AND A.date >= :dateFrom
        AND A.date < :dateTo
      GROUP BY 1
    `)

    const addresses = await Address.query(query, {
      dateFrom,
      dateTo,
      platforms: platforms.map(item => item.id)
    })

    return {
      addresses,
      platforms
    }
  }

  static async getByPlatform(platformIds, period, dateFrom, dateFromInt, dateTo) {
    const query = (`
      with recs as (
        SELECT
          EXTRACT (epoch from (items->>'date')::timestamp)::int AS timestamp,
          SUM ((items->>'count')::int)::int AS count
        FROM addresses A, jsonb_array_elements(data->'${period}') AS items
        WHERE A.platform_id in (:platformIds)
          AND A.date >= :dateFrom
          AND A.date < :dateTo
        GROUP BY 1
        ORDER BY timestamp
      )
      select * from recs where timestamp >= :dateFromInt
    `)

    return Address.query(query, { dateFrom, dateFromInt, dateTo, platformIds })
  }

  static deleteExpired(dateFrom, dateTo, periods) {
    const query = `
      UPDATE addresses
        SET data = data - ARRAY[:periods]
      WHERE date >= :dateFrom
        AND date < :dateTo
    `

    return Address.query(query, { dateFrom, dateTo, periods })
  }

}

module.exports = Address
