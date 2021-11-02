const SequelizeModel = require('./SequelizeModel')
const Coin = require('./Coin')

class CoinTvl extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        date: {
          type: DataTypes.DATE,
          allowNull: false
        },
        tvl: {
          type: DataTypes.DECIMAL,
          allowNull: false
        },
        expires_at: DataTypes.DATE
      },
      {
        sequelize,
        tableName: 'coin_tvl',
        indexes: [{
          unique: true,
          fields: ['date', 'coin_id']
        }]
      }
    )
  }

  static associate(models) {
    CoinTvl.belongsTo(models.Coin, {
      foreignKey: 'coin_id'
    })
  }

  static async getListByCoinUid(uid, dateFrom, window) {
    const [coin] = await Coin.query('select id from coins where uid = :uid', { uid })

    if (!coin) {
      return null
    }

    const query = `
      SELECT
        t2.time as date,
        t1.tvl
      FROM coin_tvl t1
      JOIN (
        SELECT
          ${this.truncateDateWindow('date', window)} as time,
          max(id) as max_id,
          max(date) as max_date
         FROM coin_tvl
        WHERE coin_id = :coin_id
          AND date >= :dateFrom
        GROUP by time
      ) t2 ON (t1.id = t2.max_id AND t1.date = t2.max_date)
    `

    return CoinTvl.query(query, { coin_id: coin.id, dateFrom })
  }

  static async exists() {
    return !!await CoinTvl.findOne()
  }

  static deleteExpired(dateFrom, dateTo) {
    return CoinTvl.query('DELETE FROM coin_tvl WHERE date > :dateFrom AND date < :dateTo', {
      dateFrom,
      dateTo
    })
  }
}

module.exports = CoinTvl
