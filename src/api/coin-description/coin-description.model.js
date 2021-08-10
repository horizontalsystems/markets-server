const { Model } = require('sequelize');

class CoinDescription extends Model {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        content: {
          type: DataTypes.STRING(100)
        }
      },
      {
        timestamps: false,
        tableName: 'coin_descriptions',
        sequelize
      }
    )
  }

  static associate(models) {
    CoinDescription.belongsTo(models.Coin)
    CoinDescription.belongsTo(models.Language)
  }

}

module.exports = CoinDescription
