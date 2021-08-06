const { Model } = require('sequelize');

class PlatformReference extends Model {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        value: {
          type: DataTypes.STRING(42)
        }
      },
      {
        timestamps: false,
        tableName: 'platform_references',
        sequelize,
      }
    )
  }

  static associate(models) {
    PlatformReference.belongsTo(models.Coin)
    PlatformReference.belongsTo(models.Platform)
  }

}

module.exports = PlatformReference
