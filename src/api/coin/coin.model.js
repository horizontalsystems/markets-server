const Sequelize = require('sequelize')

class Coin extends Sequelize.Model {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        id: {
          type: DataTypes.STRING(100),
          allowNull: false,
          primaryKey: true
        },
        name: {
          type: DataTypes.STRING(100)
        },
        code: {
          type: DataTypes.STRING(25)
        },
        erc20ContractAddress: {
          type: DataTypes.STRING(42)
        },
        bep20ContractAddress: {
          type: DataTypes.STRING(42)
        },
        bep2Symbol: {
          type: DataTypes.STRING(10)
        },
      },
      {
        timestamps: false,
        tableName: 'coins',
        sequelize
      }
    )
  }

}

module.exports = Coin
