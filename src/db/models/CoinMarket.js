const SequelizeModel = require('./SequelizeModel')

class CoinMarket extends SequelizeModel {

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
        tableName: 'coin_markets',
        indexes: [{
          unique: true,
          fields: ['coin_id', 'date']
        }]
      }
    )
  }

  static associate(models) {
    CoinMarket.belongsTo(models.Coin, {
      foreignKey: 'coin_id'
    })
  }

  static insertMarkets(values) {
    const query = `
      INSERT INTO coin_markets (coin_id, date, price, volume)
      ( SELECT
          c.id,
          v.last_updated_formatted::timestamptz,
          v.price,
         (v.market_data::json ->> 'total_volume')::numeric
        FROM (values :values) as v(uid, price, price_change, market_data, last_updated, last_updated_formatted),
            coins c
        WHERE c.uid = v.uid
      )
      ON CONFLICT (coin_id, date)
      DO UPDATE set price = EXCLUDED.price, volume = EXCLUDED.volume

    `

    return CoinMarket.query(query, { values })
  }

  static async exists() {
    return !!await CoinMarket.findOne()
  }

  static async getPriceChart(uid, window, dateFrom) {
    const query = `
      SELECT
        ${this.truncateDateWindow('date', window)} as date,
        avg(m.price) price
      FROM coin_markets m, coins c
      WHERE c.id = m.coin_id AND c.uid = :uid
            AND date >= :dateFrom
      GROUP by 1
      ORDER by date
    `

    return CoinMarket.query(query, {
      dateFrom,
      uid
    })
  }

  static async getVolumeChart(uid, window, dateFrom) {
    const query = `
      SELECT
        ${this.truncateDateWindow('date', window)} as date,
        avg(m.volume) volume
      FROM coin_markets m, coins c
      WHERE c.id = m.coin_id AND c.uid = :uid
            AND date >= :dateFrom
      GROUP by 1
      ORDER by date
    `

    return CoinMarket.query(query, {
      dateFrom,
      uid
    })
  }

  static deleteExpired(dateFrom, dateTo) {
    return CoinMarket.query('DELETE FROM coin_markets WHERE date > :dateFrom AND date < :dateTo', {
      dateFrom,
      dateTo
    })
  }

  static getNotSyncedCoins() {
    return CoinMarket.query(`
      SELECT uid
      FROM coins
      WHERE id NOT IN (
        SELECT DISTINCT(coin_id) FROM coin_markets
        WHERE date < (NOW() - INTERVAL '1 HOUR'))`)
  }
}

module.exports = CoinMarket
