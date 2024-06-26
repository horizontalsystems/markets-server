const SequelizeModel = require('./SequelizeModel')

class CoinHolder extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        address: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        balance: {
          type: DataTypes.DECIMAL,
          allowNull: false
        },
        percentage: {
          type: DataTypes.DECIMAL,
          allowNull: false
        }
      },
      {
        sequelize,
        tableName: 'coin_holders',
        timestamps: false
      }
    )
  }

  static associate(models) {
    CoinHolder.belongsTo(models.Platform, {
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

    return CoinHolder.query(query, { chain, uid })
  }

  static async exists() {
    return !!await CoinHolder.findOne()
  }

  static deleteAll(platformId) {
    return CoinHolder.query('DELETE FROM coin_holders where platform_id = :platformId', { platformId })
  }

}

module.exports = CoinHolder
