const sequelize = require('sequelize')

class Fund extends sequelize.Model {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        name: DataTypes.STRING,
        description: DataTypes.TEXT
      },
      {
        timestamps: false,
        tableName: 'funds',
        sequelize
      }
    )
  }

  static associate(models) {
    Fund.hasMany(models.FundsInvested)
  }

}

module.exports = Fund
