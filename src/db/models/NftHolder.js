const SequelizeModel = require('./SequelizeModel')

class NftHolder extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        address: {
          type: DataTypes.STRING(50),
          allowNull: false
        },
        balance: {
          type: DataTypes.STRING(100),
          allowNull: false
        }
      },
      {
        timestamps: false,
        tableName: 'nft_holders',
        sequelize
      }
    )
  }

  static associate(models) {
    NftHolder.belongsTo(models.NftAsset, {
      foreignKey: 'asset_id'
    })
  }

  static deleteAll(assetIds) {
    return NftHolder.query('DELETE FROM nft_holders where asset_id in (:assetIds)', { assetIds })
  }
}

module.exports = NftHolder
