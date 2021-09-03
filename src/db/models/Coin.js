const Sequelize = require('sequelize')
const { Op } = require('sequelize')
const Category = require('./Category')
const CoinDescription = require('./CoinDescription')
const Language = require('./Language')
const Platform = require('./Platform')

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
        market_cap_rank: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
        coingecko_id: {
          type: DataTypes.STRING,
          allowNull: false
        },
        privacy: DataTypes.STRING(6),
        decentralized: DataTypes.BOOLEAN,
        confiscation_resistance: DataTypes.BOOLEAN,
        censorship_resistance: DataTypes.BOOLEAN
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
        { model: Platform },
      ]
    })
  }

  static getByUid(uid) {
    return Coin.findOne({
      where: {
        uid
      },
      include: [
        { model: Platform },
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
