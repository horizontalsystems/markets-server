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
        indexes: [
          { unique: true, fields: ['coin_id', 'platform_id'] }
        ]
      }
    )
  }

  static associate(models) {
    PlatformReference.belongsTo(models.Coin)
    PlatformReference.belongsTo(models.Platform)
  }

}

module.exports = PlatformReference
