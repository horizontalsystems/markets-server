const SequelizeModel = require('./SequelizeModel')
const Platform = require('./Platform')

class DexLiquidity extends SequelizeModel {

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
        tableName: 'dex_liquidities',
        indexes: [{
          unique: true,
          fields: ['date', 'platform_id', 'exchange']
        }]
      }
    )
  }

  static associate(models) {
    DexLiquidity.belongsTo(models.Platform, {
      foreignKey: 'platform_id'
    })
  }

  static async exists() {
    return !!await DexLiquidity.findOne()
  }

  static async getByCoin(uid, platform, window, dateFrom) {
    const platforms = await Platform.findByCoinUID(uid, platform)
    if (!platforms.length) {
      return {}
    }

    const query = `
      SELECT
        ${this.truncateDateWindow('date', window)} as date,
        SUM(volume) AS volume,
        ARRAY_AGG(distinct platform_id) as platforms
      FROM dex_liquidities
      WHERE platform_id IN(:platformIds)
        AND date >= :dateFrom
      GROUP by 1
      ORDER by date
    `

    const liquidity = await DexLiquidity.query(query, {
      dateFrom,
      platformIds: platforms.map(item => item.id)
    })

    return { liquidity, platforms }
  }

  static getWithPlatforms(date, exchange) {
    return DexLiquidity.query(`
      SELECT
        DISTINCT ON (P.id)
        P.id, P.address, P.decimals, L.date,
        COALESCE(L.volume, 0) AS volume
      FROM platforms P
      LEFT JOIN (
        SELECT platform_id, volume, date
        FROM dex_liquidities
        WHERE date < '${date}' 
          AND exchange = '${exchange}'
      ) L ON L.platform_id = P.id
      WHERE P.type = 'erc20'
        AND P.decimals is NOT NULL
        AND P.address IS NOT NULL
        AND L.volume > 0
      ORDER BY P.id, L.date DESC
    `)
  }

  static deleteExpired(dateFrom, dateTo) {
    return DexLiquidity.query('DELETE FROM dex_liquidities WHERE date > :dateFrom AND date < :dateTo', {
      dateFrom,
      dateTo
    })
  }
}

module.exports = DexLiquidity
