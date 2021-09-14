const { Model } = require('sequelize');

class CoinDescription extends Model {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        content: DataTypes.TEXT
      },
      {
        timestamps: false,
        tableName: 'coin_descriptions',
        sequelize,
        indexes: [{
          unique: true,
          fields: ['coin_id', 'language_id']
        }]
      }
    )
  }

  static associate(models) {
    CoinDescription.belongsTo(models.Coin, {
      foreignKey: 'coin_id'
    })

    CoinDescription.belongsTo(models.Language, {
      foreignKey: 'language_id'
    })
  }

}

module.exports = CoinDescription
