const SequelizeModel = require('./SequelizeModel')

class CoinPrice extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        id: {
          type: DataTypes.BIGINT,
          autoIncrement: true,
          primaryKey: true
        },
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
          v.id,
          v.last_updated_rounded::timestamptz,
          v.price,
          (v.market_data::json ->> 'total_volume')::numeric
        FROM (values :values) as v(id, price, price_change, market_data, last_updated, last_updated_rounded)
      )
      ON CONFLICT (coin_id, date)
      DO UPDATE set price = EXCLUDED.price, volume = EXCLUDED.volume
    `

    return CoinPrice.query(query, { values })
  }

  static async exists() {
    return !!await CoinPrice.findOne()
  }

  static async getPriceChart(uid, interval, dateFrom) {
    const query = `
      SELECT
        DISTINCT ON (cp.trunc)
        cp.trunc as timestamp,
        cp.price,
        cp.volume
      FROM (
        SELECT
          p.*,
          ${this.truncateDateWindow('date', interval)} AS trunc
        FROM coin_prices p, coins c
        WHERE p.coin_id = c.id
          ${dateFrom ? 'AND EXTRACT(epoch from p.date) >= :dateFrom' : ''}
          AND c.uid = :uid
      ) cp
      WHERE cp.trunc >= :dateFrom
      ORDER BY cp.trunc, cp.date DESC
    `

    return CoinPrice.query(query, { dateFrom, uid })
  }

  static async getListByCoin(coinId, interval, dateFrom, dateFromInt) {
    const query = `
      SELECT
        DISTINCT ON (cp.trunc)
        cp.trunc as timestamp,
        cp.volume
      FROM (
        SELECT
          p.*,
          ${this.truncateDateWindow('date', interval)} AS trunc
        FROM coin_prices p
        WHERE p.coin_id = :coinId
          AND p.date >= :dateFrom
      ) cp
      WHERE cp.trunc >= :dateFromInt
      ORDER BY cp.trunc, cp.date DESC
    `

    return CoinPrice.query(query, { dateFrom, coinId, dateFromInt })
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

  static async getFirstCoinPrice(uid) {
    const [price] = await CoinPrice.query(`
      SELECT EXTRACT(epoch FROM p.date)::int AS timestamp
      FROM coin_prices p, coins c
      WHERE c.uid = :uid AND p.coin_id = c.id
      ORDER BY date ASC
      limit 1`, { uid })

    return price
  }

  static deleteExpired(dateFrom, dateTo) {
    return CoinPrice.query('DELETE FROM coin_prices WHERE date > :dateFrom AND date < :dateTo', {
      dateFrom,
      dateTo
    })
  }
}

module.exports = CoinPrice
