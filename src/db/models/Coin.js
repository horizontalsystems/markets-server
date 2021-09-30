const SequelizeModel = require('./SequelizeModel')
const Category = require('./Category')
const Platform = require('./Platform')
const utils = require('../../utils')

class Coin extends SequelizeModel {

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
        genesis_date: DataTypes.DATEONLY,
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

  static associate(models) {
    Coin.belongsToMany(models.Category, { through: 'coin_categories' })
    Coin.hasMany(models.Platform)
    Coin.hasMany(models.FundsInvested)
  }

  static getTopList(count, orderBy, orderDirection, limit) {
    return Coin.query(`
      with top_coins as (
        SELECT * FROM coins
        ORDER BY market_data->'market_cap' DESC NULLS LAST
        LIMIT ${count}
      )
      SELECT * FROM top_coins
      ORDER BY ${orderBy} ${orderDirection} NULLS LAST
      LIMIT ${limit}
    `)
  }

  static getPrices(ids) {
    const uids = ids.map(id => `'${id}'`)
    return Coin.query(`
      SELECT
        uid,
        price,
        price_change->'24h' as price_change_24h,
        EXTRACT(epoch FROM last_updated)::int AS last_updated
      FROM coins
      WHERE uid in (${uids})
    `)
  }

  static getByUid(uid) {
    return Coin.findOne({
      where: {
        uid
      },
      include: [Platform, Category]
    })
  }

  static async getTransactions(uid, window = '1h') {
    const platform = await Platform.findByCoinUID(uid)
    if (!platform) {
      return []
    }

    return Coin.query(`
      SELECT 
        ${Coin.truncateDateWindow('date', window)} as date,
        SUM(count) AS count,
        SUM(volume) AS volume
      FROM transactions
      WHERE platform_id = ${platform.id}
      GROUP by 1
    `)
  }

  static async getCoinInfo(uid) {
    const coin = await Coin.getByUid(uid)
    const priceChange = coin.price_change || {}

    return {
      ...coin.dataValues,
      performance: await Coin.getPerformance(priceChange['7d'], priceChange['30d'])
    }
  }

  static async getPerformance(price7d, price30d) {
    const [bitcoin, ethereum] = await Coin.findAll({
      attributes: ['price_change'],
      order: ['id'],
      where: {
        uid: ['bitcoin', 'ethereum']
      }
    })

    const roi = (price1, price2) => {
      return ((100 + price1) / (100 + price2) - 1) * 100
    }

    const btcPriceChange = bitcoin.price_change || {}
    const ethPriceChange = ethereum.price_change || {}

    return {
      usd: {
        '7d': utils.nullOrString(price7d),
        '30d': utils.nullOrString(price30d)
      },
      btc: {
        '7d': utils.nullOrString(roi(price7d, btcPriceChange['7d'])),
        '30d': utils.nullOrString(roi(price30d, btcPriceChange['30d'])),
      },
      eth: {
        '7d': utils.nullOrString(roi(price7d, ethPriceChange['7d'])),
        '30d': utils.nullOrString(roi(price30d, ethPriceChange['30d'])),
      }
    }
  }

}

module.exports = Coin
