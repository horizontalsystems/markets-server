const SequelizeModel = require('./SequelizeModel')
const Coin = require('./Coin')
const Category = require('./Category')

class CoinCategories extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        coin_id: {
          type: DataTypes.INTEGER,
          references: {
            model: Coin,
            key: 'id'
          }
        },
        category_id: {
          type: DataTypes.INTEGER,
          references: {
            model: Category,
            key: 'id'
          }
        },
      },
      {
        timestamps: false,
        tableName: 'coin_categories',
        sequelize
      }
    )
  }

  static associate() {
  }
}

module.exports = CoinCategories
