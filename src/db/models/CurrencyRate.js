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

  static async getCurrencyRate(currencyCode = Currency.baseCurrency, timestamp = DateTime.utc().toSeconds()) {
    const code = currencyCode.toLowerCase()
    if (code === Currency.baseCurrency) {
      return { rate: 1, last_updated: DateTime.utc() }
    }

    try {
      const [result] = await CurrencyRate.query(`
        SELECT EXTRACT(epoch from date)::int as timestamp, rate
        FROM currency_rates CR, currencies C
        WHERE CR.currency_id = C.id AND C.code = :currencyCode
        ORDER BY ABS(EXTRACT(epoch from date) - :timestamp)
        LIMIT 1`, {
        currencyCode,
        timestamp: parseInt(timestamp, 10)
      })

      return {
        rate: result ? parseFloat(result.rate) : null,
        last_updated: result.timestamp
      }
    } catch (e) {
      console.log(`Error fetching currency rate for ${currencyCode} !!!`, e)
    }

    return null
  }

  static async exists() {
    return !!await CurrencyRate.findOne()
  }
}

module.exports = CurrencyRate
