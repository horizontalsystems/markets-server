const SequelizeModel = require('./SequelizeModel')
const DefiCoin = require('./DefiCoin')

class DefiCoinTvl extends SequelizeModel {

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
        tableName: 'defi_coin_tvls',
        indexes: [{
          unique: true,
          fields: ['date', 'defi_coin_id']
        }]
      }
    )
  }

  static associate(models) {
    DefiCoinTvl.belongsTo(models.DefiCoin, {
      foreignKey: 'defi_coin_id'
    })
  }

  static async getListByCoinUid(uid, dateFrom, window) {
    const [coin] = await DefiCoin.query('select id from defi_coins where uid = :uid', {
      uid
    })

    if (!coin) {
      return null
    }

    const query = (`
      SELECT
        EXTRACT(epoch FROM t2.time)::int AS date,
        t1.tvl
      FROM defi_coin_tvls t1
      JOIN (
        SELECT
          ${this.truncateDateWindow('date', window)} as time,
          max(id) as max_id,
          max(date) as max_date
         FROM defi_coin_tvls
        WHERE defi_coin_id = :defi_coin_id
          AND date >= :dateFrom
        GROUP by time
      ) t2 ON (t1.id = t2.max_id AND t1.date = t2.max_date)
    `)

    return DefiCoinTvl.query(query, { defi_coin_id: coin.id, dateFrom })
  }

  static async exists() {
    return !!await DefiCoinTvl.findOne()
  }

  static deleteExpired(dateFrom, dateTo) {
    return DefiCoinTvl.query('DELETE FROM defi_coin_tvls WHERE date > :dateFrom AND date < :dateTo', {
      dateFrom,
      dateTo
    })
  }
}

module.exports = DefiCoinTvl
