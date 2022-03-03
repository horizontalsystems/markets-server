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

  static async getCurrencyRate(currencyCode = Currency.baseCurrency, timestamp = parseInt(DateTime.utc().ts / 1000, 10)) {
    const code = currencyCode.toLowerCase()
    if (code === Currency.baseCurrency) {
      return { rate: 1, last_updated: timestamp }
    }

    const query = `
      SELECT
        rate,
        EXTRACT(epoch from date)::int as timestamp,
        ABS(EXTRACT(epoch from date) - :timestamp) as diff
       FROM currency_rates R, currencies C
      WHERE R.currency_id = C.id
        AND C.code = :currencyCode
      ORDER BY diff
      LIMIT 1`

    const result = await CurrencyRate.query(query, { currencyCode: code, timestamp })
      .then(rate => rate[0])
      .catch(err => {
        console.log(`Error fetching currency rate for ${code}`, err)
      })

    if (!result) {
      return null
    }

    return {
      rate: result.rate,
      last_updated: result.timestamp
    }
  }

  static async exists() {
    return !!await CurrencyRate.findOne()
  }
}

module.exports = CurrencyRate
