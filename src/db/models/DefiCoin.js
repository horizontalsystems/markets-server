const SequelizeModel = require('./SequelizeModel')

class DefiCoin extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        name: DataTypes.STRING,
        logo: DataTypes.STRING,

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
        sequelize,
        indexes: [{
          unique: true,
          fields: ['coingecko_id', 'defillama_id']
        }]
      }
    )
  }

  static associate(models) {
    DefiCoin.belongsTo(models.Coin, {
      foreignKey: 'coin_id'
    })
  }

  static async exists() {
    return !!await DefiCoin.findOne()
  }

  static getList() {
    return DefiCoin.query(`
      SELECT
        C.uid,
        C.name as coin_name,
        D.*
      FROM defi_coins D
      LEFT JOIN coins C on C.id = D.coin_id
      ORDER BY D.tvl_rank
    `)
  }

  static getIds() {
    return DefiCoin.query('SELECT id, coingecko_id, defillama_id FROM defi_coins')
  }
}

module.exports = DefiCoin
