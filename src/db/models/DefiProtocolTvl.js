const SequelizeModel = require('./SequelizeModel')
const DefiProtocol = require('./DefiProtocol')

class DefiProtocolTvl extends SequelizeModel {

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
        tableName: 'defi_protocol_tvls',
        indexes: [{
          unique: true,
          fields: ['date', 'defi_protocol_id']
        }]
      }
    )
  }

  static associate(models) {
    DefiProtocolTvl.belongsTo(models.DefiProtocol, {
      foreignKey: 'defi_protocol_id'
    })
  }

  static async getListByCoinUid(uid, dateFrom, window) {
    const [defiProtocol] = await DefiProtocol.query('SELECT D.id FROM coins C LEFT JOIN defi_protocols D on D.coin_id = C.id WHERE uid = :uid LIMIT 1', {
      uid
    })

    if (!defiProtocol) {
      return []
    }

    const query = (`
      SELECT
        EXTRACT(epoch FROM t2.time)::int AS date,
        t1.tvl
      FROM defi_protocol_tvls t1
      JOIN (
        SELECT
          ${this.truncateDateWindow('date', window)} as time,
          max(id) as max_id,
          max(date) as max_date
         FROM defi_protocol_tvls
        WHERE defi_protocol_id = :defi_protocol_id
          AND date >= :dateFrom
        GROUP by time
      ) t2 ON (t1.id = t2.max_id AND t1.date = t2.max_date)
      ORDER BY date
    `)

    return DefiProtocolTvl.query(query, { defi_protocol_id: defiProtocol.id, dateFrom })
  }

  static getLastMonthTvls(dateTo) {
    const query = `
      SELECT
        dc.defillama_id,
        t1.defi_protocol_id,
        t1.tvl
      FROM defi_protocol_tvls t1
      JOIN defi_protocols dc on dc.id = t1.defi_protocol_id
      JOIN (
        SELECT
          max(id) as max_id,
          max(date) as max_date
         FROM defi_protocol_tvls
        WHERE date <= :dateTo
        GROUP by defi_protocol_id
      ) t2 ON (t1.id = t2.max_id AND t1.date = t2.max_date)
    `

    return DefiProtocolTvl.query(query, { dateTo })
  }

  static async exists() {
    return !!await DefiProtocolTvl.findOne()
  }

  static deleteExpired(dateFrom, dateTo) {
    return DefiProtocolTvl.query('DELETE FROM defi_protocol_tvls WHERE date > :dateFrom AND date < :dateTo', {
      dateFrom,
      dateTo
    })
  }
}

module.exports = DefiProtocolTvl
