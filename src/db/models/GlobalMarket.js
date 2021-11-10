const SequelizeModel = require('./SequelizeModel')

class GlobalMarket extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        date: {
          type: DataTypes.DATE,
          allowNull: false,
          unique: true
        },
        market_cap: {
          type: DataTypes.DECIMAL,
          defaultValue: 0,
          allowNull: false
        },
        defi_market_cap: {
          type: DataTypes.DECIMAL,
          defaultValue: 0,
          allowNull: false
        },
        volume: {
          type: DataTypes.DECIMAL,
          defaultValue: 0,
          allowNull: false
        },
        btc_dominance: {
          type: DataTypes.DECIMAL,
          defaultValue: 0,
          allowNull: false
        },
        tvl: {
          type: DataTypes.DECIMAL,
          defaultValue: 0,
          allowNull: false
        },
        chain_tvls: {
          type: DataTypes.JSONB
        }
      },
      {
        sequelize,
        tableName: 'global_markets'
      }
    )
  }

  static deleteExpired(dateFrom, dateTo) {
    return GlobalMarket.query('DELETE FROM global_markets WHERE date > :dateFrom AND date < :dateTo', {
      dateFrom,
      dateTo
    })
  }

  static async exists() {
    return !!await GlobalMarket.findOne()
  }
}

module.exports = GlobalMarket
