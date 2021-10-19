const SequelizeModel = require('./SequelizeModel')
const Currency = require('./Currency')

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
          type: DataTypes.DATE
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

  static async getCurrencyRate(currencyCode = Currency.baseCurrency) {
    const code = currencyCode.toLowerCase()
    if (code === Currency.baseCurrency) {
      return 1
    }

    const currency = await Currency.findByCode(code)
    if (!currency) {
      return null
    }

    const currencyPrice = await CurrencyPrice.findOne({
      where: {
        currency_id: currency.id
      },
      order: [
        ['date', 'desc']
      ]
    })

    return currencyPrice ? parseFloat(currencyPrice.price) : null
  }

  static async exists() {
    return !!await CurrencyPrice.findOne()
  }
}

module.exports = CurrencyPrice
