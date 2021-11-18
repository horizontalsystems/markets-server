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
        chain_tvls: DataTypes.JSONB,
        //  {
        //    Ethereum: 8846196.10,
        //    Polygon:  197489.07
        //    Staking:  14440365.167
        //  }
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
    const [defiCoin] = await DefiCoin.query('SELECT D.id FROM coins C LEFT JOIN defi_coins D on D.coin_id = C.id WHERE uid = :uid LIMIT 1', {
      uid
    })

    if (!defiCoin) {
      return []
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
      ORDER BY date
    `)

    return DefiCoinTvl.query(query, { defi_coin_id: defiCoin.id, dateFrom })
  }

  static getLastMonthTvls(dateTo) {
    const query = `
      SELECT
        dc.defillama_id,
        t1.defi_coin_id,
        t1.tvl
      FROM defi_coin_tvls t1
      JOIN defi_coins dc on dc.id = t1.defi_coin_id
      JOIN (
        SELECT
          max(id) as max_id,
          max(date) as max_date
         FROM defi_coin_tvls
        WHERE date <= :dateTo
        GROUP by defi_coin_id
      ) t2 ON (t1.id = t2.max_id AND t1.date = t2.max_date)
    `

    return DefiCoinTvl.query(query, { dateTo })
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
