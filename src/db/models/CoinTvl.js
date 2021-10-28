const SequelizeModel = require('./SequelizeModel')

class CoinTvl extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        date: {
          type: DataTypes.DATE,
          allowNull: false
        },
        tvl: {
          type: DataTypes.DECIMAL,
          allowNull: false
        },
        expires_at: DataTypes.DATE
      },
      {
        sequelize,
        tableName: 'coin_tvl',
        indexes: [{
          unique: true,
          fields: ['date', 'coin_id']
        }]
      }
    )
  }

  static associate(models) {
    CoinTvl.belongsTo(models.Coin, {
      foreignKey: 'coin_id'
    })
  }

  static async exists() {
    return !!await CoinTvl.findOne()
  }

  static deleteExpired(dateFrom, dateTo) {
    return CoinTvl.query('DELETE FROM coin_tvl WHERE date > :dateFrom AND date < :dateTo', {
      dateFrom,
      dateTo
    })
  }
}

module.exports = CoinTvl
