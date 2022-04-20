const SequelizeModel = require('./SequelizeModel')

class PlatformStatsHistory extends SequelizeModel {

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
        }
      },
      {
        sequelize,
        tableName: 'platform_stats_history',
        indexes: [{
          unique: true,
          fields: ['date', 'platform_stats_id']
        }]
      }
    )
  }

  static associate(models) {
    PlatformStatsHistory.belongsTo(models.PlatformStats, {
      foreignKey: 'platform_stats_id'
    })
  }

  static getByDate(date) {
    const query = `
      SELECT
        *,
        RANK() over (ORDER BY market_cap DESC) as ranked
      FROM platform_stats_history
      WHERE date = :date
      ORDER BY market_cap DESC
    `
    return PlatformStatsHistory.query(query, { date })
  }

  static getByPlatform(platform, dateFrom, window) {
    const query = `
      SELECT
        EXTRACT(epoch FROM t2.time)::int AS date,
        t1.market_cap
      FROM platform_stats_history t1
      JOIN platform_stats s on s.name = :platform
      JOIN (
        SELECT
          ${this.truncateDateWindow('date', window)} as time,
          max(id) as max_id,
          max(date) as max_date,
          platform_stats_id
         FROM platform_stats_history
        WHERE date >= :dateFrom
        GROUP by time, platform_stats_id
      ) t2 ON (t1.id = t2.max_id AND t1.date = t2.max_date AND t2.platform_stats_id = s.id)
      ORDER BY date
    `

    return PlatformStatsHistory.query(query, { dateFrom, platform })
  }

  static deleteExpired(dateFrom, dateTo) {
    return PlatformStatsHistory.query('DELETE FROM platform_stats_history WHERE date > :dateFrom AND date < :dateTo', {
      dateFrom,
      dateTo
    })
  }
}

module.exports = PlatformStatsHistory
