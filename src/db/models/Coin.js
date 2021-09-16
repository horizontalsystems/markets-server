const Sequelize = require('sequelize')
const { Op } = require('sequelize')
const Category = require('./Category')
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

        description: DataTypes.JSONB,
        //  {
        //    en: 'Description text',
        //    ru: 'Description text'
        //  }

        links: DataTypes.JSONB,
        //  {
        //    website: http://domain.com
        //    twitter: http://domain.com
        //    github: http://domain.com
        //    reddit: http://domain.com
        //    telegram: http://domain.com
        //  }

        price: DataTypes.DECIMAL,
        price_change: DataTypes.JSONB,
        //  {
        //    1y:   345.8,
        //    24h:  3.150,
        //    30d:  2.194,
        //    7d:   12.69
        //    high_24h:                     90.00,
        //    low_24h:                      10.00,
        //    ath:                          4356.99,
        //    ath_change_percentage:        23.11,
        //    ath_date:                     2021-00-01T00:00:00.000Z,
        //    atl:                          0.432,
        //    atl_change_percentage:        773.10,
        //    atl_date:                     2021-00-01T00:00:00.000Z,
        //  }

        market_data: DataTypes.JSONB,
        //  {
        //    market_cap: 1000000,
        //    market_cap_rank: 1,
        //    total_volume: 1000000,
        //    total_supply: 80000,
        //    max_supply: 80000,
        //    circulating_supply: 78000,
        //    fully_diluted_valuation: 1000000,
        //    total_value_locked: 1000000
        //  }

        security: DataTypes.JSONB,
        //  {
        //    privacy: 'high',
        //    decentralized: false,
        //    confiscation_resistance: true,
        //    censorship_resistance: false,
        //  }

        last_updated: DataTypes.DATE,
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
        [Sequelize.json("market_data->'market_cap'"), 'DESC']
      ],
      limit: 100,
      include: [
        { model: Platform },
      ]
    })
  }

  static getPrices(ids) {
    return Coin.findAll({
      attributes: ['uid','price'],
      where: {
        uid: ids
      },
    })
  }

  static getByUid(uid) {
    return Coin.findOne({
      where: {
        uid
      },
      include: [
        { model: Platform },
        { model: Category }
      ]
    })
  }

  static associate(models) {
    Coin.belongsToMany(models.Category, { through: 'coin_categories' })
    Coin.hasMany(models.Platform)
  }

}

module.exports = Coin
