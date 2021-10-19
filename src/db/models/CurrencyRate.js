const SequelizeModel = require('./SequelizeModel')
const Currency = require('./Currency')

class CurrencyRate extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        rate: {
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
        tableName: 'currency_rates',
        indexes: [{
          unique: true,
          fields: ['date', 'currency_id']
        }]
      }
    )
  }

  static associate(models) {
    CurrencyRate.belongsTo(models.Currency, {
      foreignKey: {
        name: 'currencyId',
        field: 'currency_id'
      }
    })
  }

  static deleteExpired() {
    return CurrencyRate.query('DELETE FROM currency_prices where expires_at <= NOW()')
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

    const currencyRate = await CurrencyRate.findOne({
      where: {
        currency_id: currency.id
      },
      order: [
        ['date', 'desc']
      ]
    })

    return currencyRate ? parseFloat(currencyRate.rate) : null
  }

  static async exists() {
    return !!await CurrencyRate.findOne()
  }
}

module.exports = CurrencyRate
