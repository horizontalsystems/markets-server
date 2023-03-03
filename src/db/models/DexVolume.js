const SequelizeModel = require('./SequelizeModel')
const Platform = require('./Platform')

class DexVolume extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        date: {
          type: DataTypes.DATE,
          allowNull: false
        },
        volume: {
          type: DataTypes.DECIMAL,
          allowNull: false
        },
        exchange: {
          type: DataTypes.STRING,
          allowNull: false
        }
      },
      {
        sequelize,
        tableName: 'dex_volumes',
        indexes: [{
          unique: true,
          fields: ['date', 'platform_id', 'exchange']
        }]
      }
    )
  }

  static associate(models) {
    DexVolume.belongsTo(models.Platform, {
      foreignKey: 'platform_id'
    })
  }

  static async exists() {
    return !!await DexVolume.findOne()
  }

  static async getByCoin(uid, chain, window, dateFrom, dateTo) {
    const platforms = await Platform.findByCoinUID(uid, chain)
    if (!platforms.length) {
      return {}
    }

    const query = `
      SELECT
        ${this.truncateDateWindow('date', window)} as date,
        SUM(volume) AS volume,
        ARRAY_AGG(distinct platform_id) as platforms
      FROM dex_volumes
      WHERE platform_id IN(:platformIds)
        AND date >= :dateFrom
        AND date < :dateTo
      GROUP by 1
      ORDER by date
    `

    const volumes = await DexVolume.query(query, {
      dateFrom,
      dateTo,
      platformIds: platforms.map(item => item.id)
    })

    return { volumes, platforms }
  }

  static async getByPlatform(platformIds, window, dateFrom, dateTo) {
    const query = `
      SELECT 
        ${this.truncateDateWindow('date', window)} as timestamp,
        SUM(volume) volume
      FROM dex_volumes
      WHERE platform_id IN (:platformIds)
        AND date >= :dateFrom
        AND date < :dateTo
      GROUP BY 1
      ORDER BY timestamp
    `

    return DexVolume.query(query, { dateFrom, dateTo, platformIds })
  }

  static deleteExpired(dateFrom, dateTo) {
    return DexVolume.query('DELETE FROM dex_volumes WHERE date > :dateFrom AND date < :dateTo', {
      dateFrom,
      dateTo
    })
  }
}

module.exports = DexVolume
