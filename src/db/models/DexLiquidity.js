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

  static async getByCoin(uid, chain, window, dateFrom, dateTo, showAll) {
    const platforms = await Platform.findByCoinUID(uid, chain)
    if (!platforms.length) {
      return {}
    }

    const query = `
      SELECT
        t2.trunc AS date,
        SUM(t1.volume) AS volume,
        ARRAY_AGG(distinct t1.platform_id) AS platforms
      FROM dex_liquidities t1
      JOIN (
        SELECT
          ${this.truncateDateWindow('date', window)} as trunc,
          exchange,
          platform_id,
          max(id) as max_id
         FROM dex_liquidities
        WHERE platform_id IN(:platformIds)
          AND date >= :dateFrom
          AND date < :dateTo
          ${showAll ? '' : 'AND (exchange = \'uniswap-v2\' OR exchange = \'uniswap-v3\' OR exchange = \'pancakeswap\')'}
        GROUP by trunc, exchange, platform_id
      ) t2 ON (t1.id = t2.max_id)
      GROUP by 1
      ORDER BY date
    `

    const liquidity = await DexLiquidity.query(query, {
      dateFrom,
      dateTo,
      platformIds: platforms.map(item => item.id)
    })

    return { liquidity, platforms }
  }

  static async getByPlatform(platformIds, window, dateFrom, dateFromInt, dateTo) {
    const query = `
      SELECT
        t2.trunc AS timestamp,
        SUM(t1.volume) AS volume
      FROM dex_liquidities t1
      JOIN (
        SELECT
          ${this.truncateDateWindow('date', window)} as trunc,
          max(id) as max_id,
          max(date) as max_date
         FROM dex_liquidities
        WHERE platform_id IN(:platformIds)
          AND date >= :dateFrom
          AND date <= :dateTo
          AND (exchange = 'uniswap-v2' OR exchange = 'uniswap-v3' OR exchange = 'pancakeswap')
        GROUP by trunc, exchange
      ) t2 ON (t1.id = t2.max_id)
      WHERE t2.trunc >= :dateFromInt
      GROUP by 1
      ORDER BY timestamp
    `

    return DexLiquidity.query(query, {
      dateFrom,
      dateFromInt,
      dateTo,
      platformIds
    })
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
        WHERE date < :date 
          AND exchange = :exchange
      ) L ON L.platform_id = P.id
      WHERE P.chain_uid = 'ethereum'
        AND P.decimals is NOT NULL
        AND P.address IS NOT NULL
        AND L.volume > 0
      ORDER BY P.id, L.date DESC
    `, { date, exchange })
  }

  static deleteExpired(dateFrom, dateTo) {
    return DexLiquidity.query('DELETE FROM dex_liquidities WHERE date > :dateFrom AND date < :dateTo', {
      dateFrom,
      dateTo
    })
  }
}

module.exports = DexLiquidity
