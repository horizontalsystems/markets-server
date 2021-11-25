const SequelizeModel = require('./SequelizeModel')

class DefiProtocol extends SequelizeModel {

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
      ORDER BY D.tvl_rank
    `)
  }

  static getIds() {
    return DefiProtocol.query('SELECT id, coingecko_id, defillama_id FROM defi_protocols')
  }
}

module.exports = DefiProtocol