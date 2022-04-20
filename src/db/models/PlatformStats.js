const SequelizeModel = require('./SequelizeModel')

class PlatformStats extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        name: {
          type: DataTypes.STRING(100),
          allowNull: false,
          unique: true
        },
        market_cap: DataTypes.DECIMAL,
        stats: DataTypes.JSONB
      },
      {
        sequelize,
        tableName: 'platform_stats'
      }
    )
  }

  static associate(models) {
    PlatformStats.hasMany(models.PlatformStatsHistory)
  }

  static async exists() {
    return !!await PlatformStats.findOne()
  }

  static getList() {
    return PlatformStats.query(`
      SELECT
        *,
        RANK() OVER (order by market_cap desc) as rank
      FROM platform_stats
    `)
  }

  static getPlatforms(type) {
    const query = `
      SELECT
        c.uid,
        sum(least((p.circulating_supply * c.price), (c.market_data->>'market_cap')::numeric)) mcap
      FROM platforms p, coins c
      WHERE c.id = p.coin_id
        AND p.circulating_supply is not null
        AND p.address is not null
        AND p.type = :type
      GROUP BY c.uid
      order by mcap desc
    `
    return PlatformStats.query(query, { type })
  }

  static getStats() {
    const query = `
      WITH stats as (
        SELECT
          p.type,
          sum(least((p.circulating_supply * c.price), (c.market_data->>'market_cap')::numeric)) mcap,
          count(p) as protocols
        FROM platforms p, coins c
        WHERE c.id = p.coin_id
          AND p.circulating_supply is not null
          AND p.address is not null
        GROUP BY p.type
        ORDER BY mcap desc
      )
      SELECT stats.*, p.id from stats
      LEFT JOIN platform_stats p ON p.name = stats.type
    `

    return PlatformStats.query(query)
  }

}

module.exports = PlatformStats
