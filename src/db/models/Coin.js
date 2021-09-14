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

        name: DataTypes.STRING,
        code: DataTypes.STRING,
        coingecko_id: DataTypes.STRING,

        price: DataTypes.DECIMAL,
        price_change_24h: DataTypes.DECIMAL,
        price_change_7d: DataTypes.DECIMAL,
        price_change_30d: DataTypes.DECIMAL,
        price_change_1y: DataTypes.DECIMAL,

        high_24h: DataTypes.DECIMAL,
        low_24h: DataTypes.DECIMAL,
        ath: DataTypes.DECIMAL,
        ath_change_percentage: DataTypes.DECIMAL,
        ath_date: DataTypes.DATE,
        atl: DataTypes.DECIMAL,
        atl_change_percentage: DataTypes.DECIMAL,
        atl_date: DataTypes.DATE,

        market_cap: DataTypes.DECIMAL,
        market_cap_rank: DataTypes.INTEGER,
        total_volume: DataTypes.DECIMAL,
        total_supply: DataTypes.DECIMAL,
        max_supply: DataTypes.DECIMAL,
        circulating_supply: DataTypes.DECIMAL,
        fully_diluted_valuation: DataTypes.DECIMAL,
        total_value_locked: DataTypes.DECIMAL,
        last_updated: DataTypes.DATE,

        // Privacy
        privacy: DataTypes.STRING(6),
        decentralized: DataTypes.BOOLEAN,
        confiscation_resistance: DataTypes.BOOLEAN,
        censorship_resistance: DataTypes.BOOLEAN,
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
      order: [
        ['market_cap', 'DESC']
      ],
      limit: 100,
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
