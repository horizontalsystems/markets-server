const { Model } = require('sequelize')

class Fund extends Model {

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
        },
        is_individual: DataTypes.BOOLEAN,
        website: DataTypes.TEXT,
      },
      {
        timestamps: false,
        tableName: 'funds',
        sequelize
      }
    )
  }

  static associate() {
  }

}

module.exports = Fund
