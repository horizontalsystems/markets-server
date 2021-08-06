const Sequelize = require('sequelize')
const { Op } = require('sequelize');
const PlatformReference = require('../platform-reference/platform-reference');
const Category = require('../category/category.model');

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
        }
      },
      {
        timestamps: false,
        tableName: 'coins',
        sequelize
      }
    )
  }

  static search(filter) {
    const where = {}

    if (filter) {
      const condition = { [Op.iLike]: `%${filter}%` }
      where[Op.or] = [{ name: condition }, { code: condition }]
    }

    return Coin.findAll({
      where
    })
  }

  static getById(id) {
    console.log(id)
    return Coin.findOne({
      where: {
        id
      },
      include: [
        { model: PlatformReference },
        { model: Category },
      ]
    })
  }

  static associate(models) {
    Coin.belongsToMany(models.Category, { through: 'coin_categories' })
    Coin.hasMany(models.PlatformReference)
  }

}

module.exports = Coin
