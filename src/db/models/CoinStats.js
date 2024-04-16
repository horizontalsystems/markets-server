const SequelizeModel = require('./SequelizeModel')
const { mapToField } = require('../../utils')

class CoinStats extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        id: {
          type: DataTypes.BIGINT,
          autoIncrement: true,
          primaryKey: true
        },
        rank: DataTypes.JSONB,
        //  {
        //    tvl: 100
        //    tvl_rank: 1
        //  }
        other: DataTypes.JSONB,
        // {
        //   reports: 1,
        //   funding: 100,
        //   treasuries: 1000
        // }
      },
      {
        sequelize,
        tableName: 'coin_stats',
        indexes: [{
          unique: true,
          fields: ['coin_id']
        }]
      }
    )
  }

  static associate(models) {
    CoinStats.belongsTo(models.Coin, {
      foreignKey: 'coin_id'
    })
  }

  static analytics(coinId) {
    return CoinStats.findOne({ where: { coin_id: coinId } })
  }

  static getList() {
    return CoinStats.query('select c.uid, s.rank from coins c, coin_stats s where c.id = s.coin_id and s.rank is not null ORDER BY c.market_data->\'market_cap\' desc nulls last')
  }

  static getOtherStats() {
    return CoinStats.query(`
      with records as (
        SELECT
          C.id,
          sum(DISTINCT F.amount) as funds_invested,
          sum(DISTINCT T.amount) * C.price as treasuries,
          count(DISTINCT R.id) as reports
        FROM coins C
        LEFT JOIN funds_invested F ON F.coin_id = C.id
        LEFT JOIN treasuries T ON T.coin_id = C.id
        LEFT JOIN reports R on R.coin_id = C.id
        GROUP BY C.id
      )
      SELECT * from records
       WHERE funds_invested > 0
          OR treasuries > 0
          OR reports > 0
    `)
  }

  static async getCoinRanksMap() {
    const records = await CoinStats.query('select coin_id, rank from coin_stats')
    return mapToField(records, 'coin_id', 'rank')
  }

}

module.exports = CoinStats
