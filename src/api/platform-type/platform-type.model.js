const { Model } = require('sequelize');

class PlatformType extends Model {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        uid: {
          type: DataTypes.STRING(20),
          allowNull: false,
          unique: true
        },
        description: {
          type: DataTypes.STRING(100)
        }
      },
      {
        timestamps: false,
        tableName: 'platform_types',
        sequelize
      }
    )
  }

  static associate(models) {
    PlatformType.hasMany(models.Platform)
  }

}

module.exports = PlatformType
