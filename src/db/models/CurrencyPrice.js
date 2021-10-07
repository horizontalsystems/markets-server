const SequelizeModel = require('./SequelizeModel')

class CurrencyPrice extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        price: {
          type: DataTypes.DECIMAL,
          allowNull: false
        },
        date: {
          type: DataTypes.DATE,
          allowNull: false
        },
        expires_at: {
          type: DataTypes.DATE,
          allowNull: false
        }
      },
      {
        sequelize,
        tableName: 'currency_prices',
        indexes: [{
          unique: true,
          fields: ['date', 'currency_id']
        }]
      }
    )
  }

  static associate(models) {
    CurrencyPrice.belongsTo(models.Currency, {
      foreignKey: {
        name: 'currencyId',
        field: 'currency_id'
      }
    })
  }

  static deleteExpired() {
    return CurrencyPrice.query('DELETE FROM currency_prices where expires_at <= NOW()')
  }

}

module.exports = CurrencyPrice
