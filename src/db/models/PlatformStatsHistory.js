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

  static deleteExpired(dateFrom, dateTo) {
    return PlatformStatsHistory.query('DELETE FROM platform_stats_history WHERE date > :dateFrom AND date < :dateTo', {
      dateFrom,
      dateTo
    })
  }
}

module.exports = PlatformStatsHistory
