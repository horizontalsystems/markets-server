const { sum } = require('lodash')
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
        t2.time AS date,
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

  static getByDefiProtocol(defiProtocolId, dateFrom, window) {
    const query = (`
      SELECT
        t2.time AS date,
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

    return DefiProtocolTvl.query(query, { defi_protocol_id: defiProtocolId, dateFrom })
  }

  static getListByDate(dateTo, slugs, interval = '1 day') {
    const query = `
      SELECT * from (
        SELECT
          P.defillama_id,
          T.defi_protocol_id,
          T.tvl,
          ROW_NUMBER() OVER (PARTITION BY P.defillama_id ORDER BY T.date DESC) rn
         FROM defi_protocol_tvls T
         JOIN defi_protocols P on P.id = T.defi_protocol_id
        WHERE date <= :dateTo
          AND date >= (timestamp :dateTo - INTERVAL :interval)
          AND P.defillama_id IN(:slugs)
        ORDER BY T.date
      ) x
      WHERE x.rn = 1
    `

    return DefiProtocolTvl.query(query, { dateTo, interval, slugs })
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

  static delete(defiProtocol) {
    return DefiProtocolTvl.destroy({
      where: {
        defi_protocol_id: defiProtocol
      }
    })
  }

  static async mergeProtocols(baseProtocol, childProtocols) {
    const recs = {}
    const data = await DefiProtocolTvl.query(`
      SELECT t.date, t.tvl, t.chain_tvls
        FROM defi_protocols p, defi_protocol_tvls t
       WHERE p.id = t.defi_protocol_id
        AND p.defillama_id in (:childProtocols)
    `, { childProtocols: childProtocols.map(p => p.defillama_id) })

    for (let i = 0; i < data.length; i += 1) {
      const item2 = data[i]
      const item1 = recs[item2.date]

      if (item1) {
        item1.tvl = sum([parseFloat(item1.tvl), parseFloat(item2.tvl)])

        Object.keys(item2.chain_tvls).forEach(key => {
          item1.chain_tvls[key] = sum([
            item1.chain_tvls[key],
            item2.chain_tvls[key]
          ])
        })
      } else {
        recs[item2.date] = { ...item2, defi_protocol_id: baseProtocol.id }
      }
    }

    await DefiProtocolTvl.delete(childProtocols.map(p => p.id))
    await DefiProtocolTvl.bulkCreate(Object.values(recs))

    console.log(`Merged into base protocol: ${baseProtocol.coingecko_id}`)
  }

}

module.exports = DefiProtocolTvl
