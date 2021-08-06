const { Model } = require('sequelize');

class Platform extends Model {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        id: {
          type: DataTypes.STRING(20),
          allowNull: false,
          primaryKey: true
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
