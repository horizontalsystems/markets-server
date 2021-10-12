const Sequelize = require('sequelize')

class Treasury extends Sequelize.Model {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        type: DataTypes.ENUM('public', 'private', 'etf'),
        volume: DataTypes.DECIMAL,
        country: DataTypes.STRING,
      },
      {
        timestamps: false,
        tableName: 'treasuries',
        sequelize
      }
    )
  }

  static associate(models) {
    Treasury.belongsTo(models.Coin, {
      foreignKey: 'coin_id'
    })
  }

}

module.exports = Treasury
