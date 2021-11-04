const SequelizeModel = require('./SequelizeModel')

class DefiCoin extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        coingecko_id: DataTypes.STRING,
        defillama_id: DataTypes.STRING,

        uid: {
          type: DataTypes.STRING(100),
          allowNull: false,
          unique: true
        },

        tvl: {
          type: DataTypes.DECIMAL,
          allowNull: false
        },

        tvl_rank: {
          type: DataTypes.DECIMAL,
          allowNull: false
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

        chains: DataTypes.ARRAY(DataTypes.STRING)
        //
        // ["ethereum", "fantom", "avalanche"]
        //
      },
      {
        timestamps: false,
        tableName: 'defi_coins',
        sequelize
      }
    )
  }

  static associate() {
  }

  static async exists() {
    return !!await DefiCoin.findOne()
  }

  static getList() {
    return DefiCoin.query('SELECT * FROM defi_coins ORDER BY tvl_rank ASC NULLS LAST')
  }

  static getIds() {
    return DefiCoin.query('SELECT id, uid, defillama_id FROM defi_coins WHERE defillama_id IS NOT NULL')
  }
}

module.exports = DefiCoin
