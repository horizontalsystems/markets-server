const { Model } = require('sequelize')

class Platform extends Model {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        type: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        decimal: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
        reference: DataTypes.STRING(100)
      },
      {
        timestamps: false,
        tableName: 'platforms',
        sequelize,
        indexes: [{
          unique: true,
          fields: ['coin_id', 'type']
        }]
      }
    )
  }

  static associate(models) {
    Platform.belongsTo(models.Coin, {
      foreignKey: 'coin_id'
    })
  }

}

module.exports = Platform
