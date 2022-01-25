const { DateTime } = require('luxon')
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

  static deleteExpired(dateFrom, dateTo) {
    return CurrencyRate.query('DELETE FROM currency_rates WHERE date > :dateFrom AND date < :dateTo', {
      dateFrom,
      dateTo
    })
  }

  static async getCurrencyRate(currencyCode = Currency.baseCurrency) {
    const code = currencyCode.toLowerCase()
    if (code === Currency.baseCurrency) {
      return { rate: 1, last_updated: DateTime.utc() }
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

    return {
      rate: currencyRate ? parseFloat(currencyRate.rate) : null,
      last_updated: currencyRate.date
    }
  }

  static async exists() {
    return !!await CurrencyRate.findOne()
  }
}

module.exports = CurrencyRate
