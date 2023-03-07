const SequelizeModel = require('./SequelizeModel')

class CoinHolderStats extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        total: {
          type: DataTypes.STRING,
          allowNull: false
        },
        holders: DataTypes.JSONB
      },
      {
        sequelize,
        tableName: 'coin_holder_stats',
        indexes: [{
          unique: true,
          fields: ['platform_id']
        }]
      }
    )
  }

  static associate(models) {
    CoinHolderStats.belongsTo(models.Platform, {
      foreignKey: 'platform_id'
    })
  }

  static async getList(uid, chain = 'ethereum') {
    const query = (`
      SELECT H.*
        FROM coin_holders H
        JOIN platforms P on P.id = H.platform_id
        JOIN coins C on C.id = P.coin_id
       WHERE C.uid = :uid
         AND P.chain_uid = :chain
    `)

    return CoinHolderStats.query(query, { chain, uid })
  }

  static async exists() {
    return !!await CoinHolderStats.findOne()
  }

  static deleteAll(platformId) {
    return CoinHolderStats.query('DELETE FROM coin_holders where platform_id = :platformId', { platformId })
  }

}

module.exports = CoinHolderStats
