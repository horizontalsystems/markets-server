const SequelizeModel = require('./SequelizeModel')
const { mapToField } = require('../../utils')

class CoinTicker extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        base: {
          type: DataTypes.STRING,
          allowNull: false
        },
        target: {
          type: DataTypes.STRING,
          allowNull: false
        },
        base_uid: {
          type: DataTypes.STRING,
          allowNull: false
        },
        target_uid: {
          type: DataTypes.STRING,
          allowNull: false
        },
        price: DataTypes.DECIMAL,
        volume: DataTypes.DECIMAL,
        volume_usd: DataTypes.DECIMAL,
        market_uid: DataTypes.STRING(50),
        market_name: DataTypes.STRING(50),
        market_logo: DataTypes.STRING,
        trade_url: DataTypes.STRING,
      },
      {
        sequelize,
        tableName: 'coin_tickers',
        indexes: [{
          unique: true,
          fields: ['base', 'target', 'market_uid']
        }],
        timestamps: false
      }
    )
  }

  static associate(models) {
    CoinTicker.belongsTo(models.Coin, {
      foreignKey: 'base_coin_id'
    })
    CoinTicker.belongsTo(models.Coin, {
      foreignKey: 'target_coin_id'
    })
  }

  static async exists() {
    return !!await CoinTicker.findOne()
  }

  static getTopPairs(limit, offset = 0) {
    return CoinTicker.query(`
      SELECT m.*
        FROM coin_tickers m, exchanges e
       WHERE m.market_uid = e.uid
       ORDER by m.volume_usd desc
       LIMIT :limit
      OFFSET :offset
    `, { limit, offset })
  }

  static async getCoinsListedOnWE() {
    const records = await CoinTicker.query(`
      WITH tickers AS (
        SELECT m.base_coin_id as coin_id FROM coin_tickers m, exchanges e WHERE m.market_uid = e.uid
        UNION ALL
        SELECT m.target_coin_id as coin_id FROM coin_tickers m, exchanges e WHERE m.market_uid = e.uid
      )
      SELECT distinct coin_id FROM tickers;
    `)

    return mapToField(records, 'coin_id', 'coin_id')
  }

  static deleteAll(coinId) {
    return CoinTicker.query('DELETE FROM coin_tickers where base_coin_id = :coinId', { coinId })
  }
}

module.exports = CoinTicker
