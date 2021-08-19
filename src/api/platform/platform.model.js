const { Model } = require('sequelize');

class Platform extends Model {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        value: {
          type: DataTypes.STRING(42)
        }
      },
      {
        timestamps: false,
        tableName: 'platforms',
        sequelize,
        indexes: [
          { unique: true, fields: ['coin_id', 'platform_type_id'] }
        ]
      }
    )
  }

  static associate(models) {
    Platform.belongsTo(models.Coin)
    Platform.belongsTo(models.PlatformType)
  }

}

module.exports = Platform
