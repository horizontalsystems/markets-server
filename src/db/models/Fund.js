const { Model } = require('sequelize')

class Fund extends Model {

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
