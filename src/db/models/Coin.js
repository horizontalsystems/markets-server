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

        defi_data: DataTypes.JSONB,
        //  {
        //    tvl:            19198417852.24,
        //    tvl_rank:       1,
        //    tvl_change_1h:  0.076,
        //    tvl_change_1d:  0.734,
        //    tvl_change_7d:  13.61,
        //    staking:        1444036569.167,
        //    chains:         ["Ethereum", "Fantom", "Avalanche"]
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

  static async getTransactions(uid, window = '1h', dateFrom) {
    const platform = await Platform.findByCoinUID(uid)
    if (!platform) {
      return []
    }

    const query = `
      SELECT 
        ${Coin.truncateDateWindow('date', window)} as date,
        SUM(count) AS count,
        SUM(volume) AS volume
      FROM transactions
      WHERE platform_id = :platform_id
        AND date >= :date_from
      GROUP by 1
      ORDER by date
    `

    return Coin.query(query, {
      platform_id: platform.id,
      date_from: dateFrom
    })
  }

  static async getAddresses(uid, window = '1h') {
    const platform = await Platform.findByCoinUID(uid)
    if (!platform) {
      return []
    }

    return Coin.query(`
      SELECT 
        ${Coin.truncateDateWindow('date', window)} as date,
        SUM(count) AS count,
        SUM(volume) AS volume
      FROM addresses
      WHERE platform_id = ${platform.id}
      GROUP by 1
      ORDER BY date ASC
    `)
  }

  static async getCoinHolders(uid, limit = 10) {
    const platform = await Platform.findByCoinUID(uid)
    if (!platform) {
      return []
    }

    return Coin.query(`
      SELECT address, balance
      FROM coin_holders
      WHERE platform_id = ${platform.id}
      ORDER BY balance DESC
      LIMIT ${limit > 20 ? 20 : limit}
    `)
  }

  static async getAddressRanks(uid, limit = 10) {
    const platform = await Platform.findByCoinUID(uid)
    if (!platform) {
      return []
    }

    return Coin.query(`
      SELECT address, volume
      FROM address_ranks
      WHERE platform_id = ${platform.id}
      ORDER BY volume DESC
      LIMIT ${limit > 20 ? 20 : limit}
    `)
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
        C.links,
        C.security,
        C.defi_data->'tvl' as tvl,
        C.defi_data->'tvl_rank' as tvl_rank,
        C.market_data->'market_cap' as market_cap,
        sum(F.amount) as funds_invested,
        sum(T.amount) as treasuries
      FROM coins C
      LEFT JOIN funds_invested F ON F.coin_id = C.id
      LEFT JOIN treasuries T ON T.coin_id = C.id
      WHERE uid = :uid
      GROUP BY C.id
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

}

module.exports = Coin
