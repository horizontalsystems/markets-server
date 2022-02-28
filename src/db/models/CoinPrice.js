const SequelizeModel = require('./SequelizeModel')

class CoinPrice extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        date: {
          type: DataTypes.DATE,
          allowNull: false
        },
        price: {
          type: DataTypes.DECIMAL,
          defaultValue: 0
        },
        volume: {
          type: DataTypes.DECIMAL,
          defaultValue: 0
        }
      },
      {
        sequelize,
        tableName: 'coin_prices',
        indexes: [{
          unique: true,
          fields: ['coin_id', 'date']
        }]
      }
    )
  }

  static associate(models) {
    CoinPrice.belongsTo(models.Coin, {
      foreignKey: 'coin_id'
    })
  }

  static insertMarkets(values) {
    const query = `
      INSERT INTO coin_prices (coin_id, date, price, volume)
        (SELECT
          c.id,
          v.last_updated_rounded::timestamptz,
          v.price,
          (v.market_data::json ->> 'total_volume')::numeric
        FROM (values :values) as v(uid, price, price_change, market_data, last_updated, last_updated_rounded), coins c
        WHERE c.uid = v.uid
      )
      ON CONFLICT (coin_id, date)
      DO UPDATE set price = EXCLUDED.price, volume = EXCLUDED.volume
    `

    return CoinPrice.query(query, { values })
  }

  static async exists() {
    return !!await CoinPrice.findOne()
  }

  static async getPriceChart(uid, window, dateFrom) {
    const query = `
      SELECT
        DISTINCT ON (cp.date_trunc)
        EXTRACT(epoch from cp.date)::int as timestamp,
        cp.price,
        cp.volume
      FROM (
        SELECT
          p.*,
          ${this.truncateDateWindow('date', window)} AS date_trunc
        FROM coin_prices p, coins c
        WHERE p.coin_id = c.id
          AND p.date >= :dateFrom
          AND c.uid = :uid
      ) cp
      ORDER BY cp.date_trunc, cp.date DESC
    `

    return CoinPrice.query(query, { dateFrom, uid })
  }

  static async getHistoricalPrice(coinUid, timestamp) {
    const query = `
      SELECT
        EXTRACT(epoch from date)::int as timestamp,
        cp.price as price
      FROM coin_prices cp, coins c
      WHERE cp.coin_id = c.id
        AND c.uid = :coinUid
      ORDER BY ABS(EXTRACT(epoch from date) - :timestamp)
      LIMIT 1`

    const [result] = await CoinPrice.query(query, { coinUid, timestamp })
    return result
  }

  static deleteExpired(dateFrom, dateTo) {
    return CoinPrice.query('DELETE FROM coin_prices WHERE date > :dateFrom AND date < :dateTo', {
      dateFrom,
      dateTo
    })
  }
}

module.exports = CoinPrice
