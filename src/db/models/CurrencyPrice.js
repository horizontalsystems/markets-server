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

  static async getLatestCurrencyPrice(currencyCode) {
    const currency = await Currency.findByCurrencyCode(currencyCode)
    if (!currency) {
      return null
    }

    const [result] = await CurrencyPrice.query(`
      SELECT
        price
      FROM currency_prices
      WHERE currency_id = :currencyId
      ORDER BY date DESC
      LIMIT 1`,
    {
      currencyId: currency.id
    })

    if (result) {
      return parseFloat(result.price)
    }

    return null
  }
}

module.exports = CurrencyPrice
