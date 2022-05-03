const { Model } = require('sequelize')

class Chain extends Model {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        uid: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false
        }
      },
      {
        timestamps: false,
        tableName: 'chains',
        sequelize
      }
    )
  }

}

module.exports = Chain
