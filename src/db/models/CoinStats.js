const SequelizeModel = require('./SequelizeModel')

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

}

module.exports = CoinStats
