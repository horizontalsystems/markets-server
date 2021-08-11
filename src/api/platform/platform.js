const { Model } = require('sequelize');

class Platform extends Model {

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
        tableName: 'platforms',
        sequelize
      }
    )
  }

  static associate(models) {
    Platform.hasMany(models.PlatformReference)
  }

}

module.exports = Platform
