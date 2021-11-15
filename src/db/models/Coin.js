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
        defillama_id: DataTypes.STRING,
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
        //    fully_diluted_valuation: 1000000
        //  }

        security: DataTypes.JSONB,
        //  {
        //    privacy: 'high',
        //    decentralized: false,
        //    confiscation_resistance: true,
        //    censorship_resistance: false,
        //  }

        is_defi: DataTypes.BOOLEAN,
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
    Coin.belongsToMany(models.Category, { through: models.CoinCategories })
    Coin.hasMany(models.Platform)
    Coin.hasMany(models.FundsInvested)
  }

  static getPrices(uids) {
    const query = `
      SELECT
        uid,
        price,
        price_change->'24h' as price_change_24h,
        EXTRACT(epoch FROM last_updated)::int AS last_updated
      FROM coins
      WHERE uid IN (:uids)
    `

    return Coin.query(query, { uids })
  }

  static async getMarketData(uid, type = 'erc20') {
    const query = (`
      SELECT
        market_data,
        P.id AS platform_id
      FROM coins C
      LEFT JOIN platforms P ON C.id = P.coin_id
      WHERE C.uid = :uid AND P.type = :type
    `)

    const [marketData] = await Coin.query(query, { uid, type })
    return marketData
  }

  static async getCoinInfo(uid) {
    const coin = await Coin.findOne({
      include: [Platform, Category],
      where: {
        uid
      }
    })

    if (!coin) {
      return null
    }

    const priceChange = coin.price_change || {}
    return {
      ...coin.dataValues,
      performance: await Coin.getPerformance(priceChange['7d'], priceChange['30d'])
    }
  }

  static async getCoinDetails(uid) {
    const query = (`
      SELECT
        C.uid,
        C.security,
        D.tvl,
        D.tvl_rank,
        C.market_data->'market_cap' as market_cap,
        sum(F.amount) * C.price as funds_invested,
        sum(T.amount) * C.price as treasuries,
        count(DISTINCT R.id) as reports
      FROM coins C
      LEFT JOIN defi_coins D ON D.coin_id = C.id
      LEFT JOIN funds_invested F ON F.coin_id = C.id
      LEFT JOIN treasuries T ON T.coin_id = C.id
      LEFT JOIN reports R on R.coin_id = C.id
      WHERE C.uid = :uid
      GROUP BY C.id, D.tvl, D.tvl_rank
    `)

    const [coin] = await Coin.query(query, { uid })
    return coin
  }

  static async getPerformance(price7d, price30d) {
    const [bitcoin, ethereum] = await Coin.query(`
      SELECT price_change
        FROM coins
       WHERE coins.uid IN ('bitcoin', 'ethereum')
       ORDER BY id
    `)

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

  static updateCoins(values) {
    const query = `
      UPDATE coins AS c set
        price = v.price,
        price_change = v.price_change::json,
        market_data = v.market_data::json,
        last_updated = v.last_updated::timestamptz
      FROM (values :values) as v(uid, price, price_change, market_data, last_updated)
      WHERE c.uid = v.uid
    `

    return Coin.queryUpdate(query, { values })
  }
}

module.exports = Coin
