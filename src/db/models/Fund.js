const { Model } = require('sequelize')

class Fund extends Model {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        name: {
          type: DataTypes.STRING,
          allowNull: false
        },
        description: DataTypes.TEXT,
        website: DataTypes.TEXT
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
