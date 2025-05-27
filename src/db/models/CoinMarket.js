const SequelizeModel = require('./SequelizeModel')
const { mapToField } = require('../../utils')

class CoinMarket extends SequelizeModel {

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
        tableName: 'coin_markets',
        timestamps: false
      }
    )
  }

  static associate(models) {
    CoinMarket.belongsTo(models.Coin, {
      foreignKey: 'coin_id'
    })
  }

  static async exists() {
    return !!await CoinMarket.findOne()
  }

  static getTopPairs(limit, offset = 0) {
    return CoinMarket.query(`
      SELECT m.*
        FROM coin_markets m, verified_exchanges e
       WHERE m.market_uid = e.uid
       ORDER by m.volume_usd desc
       LIMIT :limit
      OFFSET :offset
    `, { limit, offset })
  }

  static async getCoinsListedOnWE() {
    const records = await CoinMarket.query('SELECT distinct m.coin_id FROM coin_markets m, verified_exchanges e WHERE m.market_uid = e.uid')
    return mapToField(records, 'coin_id', 'coin_id')
  }

  static deleteAll(coinId) {
    return CoinMarket.query('DELETE FROM coin_markets where coin_id = :coinId', { coinId })
  }

}

module.exports = CoinMarket
