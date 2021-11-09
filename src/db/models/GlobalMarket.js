const SequelizeModel = require('./SequelizeModel')

class GlobalMarket extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        marketCap: {
          type: DataTypes.DECIMAL,
          defaultValue: 0,
          allowNull: false,
          field: 'market_cap'
        },
        defiMarketCap: {
          type: DataTypes.DECIMAL,
          defaultValue: 0,
          allowNull: false,
          field: 'defi_market_cap'
        },
        volume: {
          type: DataTypes.DECIMAL,
          defaultValue: 0,
          allowNull: false
        },
        btcDominance: {
          type: DataTypes.DECIMAL,
          defaultValue: 0,
          allowNull: false,
          field: 'btc_dominance'
        },
        tvl: {
          type: DataTypes.DECIMAL,
          defaultValue: 0,
          allowNull: false
        },
        chainTvl: {
          type: DataTypes.JSONB,
          field: 'chain_tvl'
        },
        date: {
          type: DataTypes.DATE,
          allowNull: false,
          unique: true
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
