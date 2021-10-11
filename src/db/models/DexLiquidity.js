const SequelizeModel = require('./SequelizeModel')

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
        },
        expires_at: DataTypes.DATE
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

  static getWithPlatforms(date, exchange) {
    return DexLiquidity.query(`
      SELECT
        P.id, P.address, P.decimals, L.volume, L.date,
        COALESCE(L.volume, 0) AS volume
      FROM platforms P
      LEFT JOIN (
        SELECT platform_id, volume, date
        FROM dex_liquidities
        WHERE date < '${date}' 
          and exchange = '${exchange}'
        LIMIT 1
      ) L ON L.platform_id = P.id
      WHERE P.type = 'erc20'
        AND P.decimals is NOT NULL
        AND P.address IS NOT NULL
    `)
  }

  static deleteExpired() {
    return DexLiquidity.query('DELETE FROM dex_volumes where expires_at <= NOW()')
  }

}

module.exports = DexLiquidity
