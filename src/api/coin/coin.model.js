const Sequelize = require('sequelize')
const { Op } = require('sequelize');
const Category = require('../category/category.model');
const CoinDescription = require('../coin-description/coin-description.model');
const Language = require('../language/language.model');
const Platform = require('../platform/platform.model');
const PlatformType = require('../platform-type/platform-type.model');

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
        decimal: {
          type: DataTypes.INTEGER,
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
        { model: Platform, include: { model: PlatformType } },
      ]
    })
  }

  static getByUid(uid) {
    return Coin.findOne({
      where: {
        uid
      },
      include: [
        { model: Platform, include: { model: PlatformType } },
        { model: Category },
        { model: CoinDescription, include: { model: Language } }
      ]
    })
  }

  static associate(models) {
    Coin.belongsToMany(models.Category, { through: 'coin_categories' })
    Coin.hasMany(models.Platform)
    Coin.hasMany(models.CoinDescription)
  }

}

module.exports = Coin
