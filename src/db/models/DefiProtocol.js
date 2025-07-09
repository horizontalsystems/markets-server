const SequelizeModel = require('./SequelizeModel')

class DefiProtocol extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        name: DataTypes.STRING,
        logo: DataTypes.STRING,
        url: DataTypes.STRING,

        coingecko_id: DataTypes.STRING,
        defillama_id: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true
        },

        tvl: {
          type: DataTypes.DECIMAL,
          allowNull: false
        },

        tvl_rank: {
          type: DataTypes.INTEGER
        },

        tvl_change: DataTypes.JSONB,
        //  {
        //    change_1h:  0.076,
        //    change_1d:  0.734,
        //    change_7d:  13.61
        //    change_30d: 13.61
        //  }

        chain_tvls: DataTypes.JSONB,
        //  {
        //    ethereum: 8846196.10,
        //    polygon:  197489.07
        //    staking:  14440365.167
        //  }

        chains: DataTypes.ARRAY(DataTypes.STRING),
        //
        // ["ethereum", "fantom", "avalanche"]
        //
      },
      {
        timestamps: false,
        tableName: 'defi_protocols',
        sequelize
      }
    )
  }

  static associate(models) {
    DefiProtocol.belongsTo(models.Coin, {
      foreignKey: 'coin_id'
    })
  }

  static async exists() {
    return !!await DefiProtocol.findOne()
  }

  static getList() {
    return DefiProtocol.query(`
      SELECT
        C.uid,
        C.name as coin_name,
        D.*
      FROM defi_protocols D
      LEFT JOIN coins C on C.id = D.coin_id
      WHERE D.tvl_rank IS NOT NULL and D.tvl > 0
      ORDER BY D.tvl_rank
    `)
  }

  static getIds(defillamaIds) {
    const where = {}

    if (defillamaIds) {
      where.defillama_id = defillamaIds
    }

    return DefiProtocol.findAll({ attributes: ['id', 'coingecko_id', 'defillama_id'], where })
  }

  static clean(ids) {
    if (!ids.length) {
      return
    }

    return DefiProtocol.query('DELETE FROM defi_protocols WHERE id NOT IN(:ids)', { ids })
  }

  static resetRank() {
    return DefiProtocol.query(`
      UPDATE defi_protocols p SET tvl_rank = r.ranked
      FROM (
        SELECT id, ROW_NUMBER() OVER(order by tvl desc nulls last) AS ranked FROM defi_protocols
      ) r
      WHERE p.id = r.id
    `)
  }
}

module.exports = DefiProtocol
