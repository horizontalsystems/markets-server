const Sequelize = require('sequelize')
const { Op } = require('sequelize');
const PlatformReference = require('../platform-reference/platform-reference');
const Category = require('../category/category.model');
const CoinDescription = require('../coin-description/coin-description.model');
const Platform = require('../platform/platform');
const Language = require('../language/language.model');

class Coin extends Sequelize.Model {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        uid: {
          type: DataTypes.STRING(100),
          allowNull: false,
          unique: true
        },
        name: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        code: {
          type: DataTypes.STRING(25),
          allowNull: false
        },
        privacy: {
          type: DataTypes.STRING(6)
        },
        decentralized: {
          type: DataTypes.BOOLEAN
        },
        confiscation_resistance: {
          type: DataTypes.BOOLEAN
        },
        censorship_resistance: {
          type: DataTypes.BOOLEAN
        },
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
      where,
      include: [
        { model: PlatformReference, include: { model: Platform } },
      ]
    })
  }

  static getByUid(uid) {
    return Coin.findOne({
      where: {
        uid
      },
      include: [
        { model: PlatformReference, include: { model: Platform } },
        { model: Category },
        { model: CoinDescription, include: { model: Language } }
      ]
    })
  }

  static associate(models) {
    Coin.belongsToMany(models.Category, { through: 'coin_categories' })
    Coin.hasMany(models.PlatformReference)
    Coin.hasMany(models.CoinDescription)
  }

}

module.exports = Coin
