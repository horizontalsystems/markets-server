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

        img_path: DataTypes.STRING,

        price: DataTypes.DECIMAL,
        price_change_24h: DataTypes.DECIMAL,
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
    Coin.hasMany(models.CoinCategories)
    Coin.hasMany(models.Platform)
    Coin.hasMany(models.FundsInvested)
    Coin.hasMany(models.CoinPrice)
    Coin.hasMany(models.CoinStats)
    Coin.hasMany(models.CoinMarket)
    Coin.hasMany(models.CoinIndicator)
  }

  static getList() {
    return Coin.query(`
      SELECT
        uid,
        name,
        code,
        coingecko_id,
        img_path,
        market_data->'market_cap_rank' as market_cap_rank
      FROM coins
      ORDER BY id
    `)
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

  static async getCoinInfo(uid) {
    const coin = await Coin.findOne({
      include: [Platform, Category],
      where: {
        uid
      },
    })

    if (!coin) {
      return null
    }

    const priceChange = coin.price_change || {}
    return {
      ...coin.dataValues,
      performance: await Coin.getPerformance(coin.uid, priceChange['7d'], priceChange['30d'])
    }
  }

  static async getCoinDetails(uid) {
    const query = (`
      SELECT
        C.uid,
        C.security,
        P.tvl,
        P.tvl_rank,
        C.market_data->'market_cap' as market_cap,
        sum(DISTINCT F.amount) as funds_invested,
        sum(DISTINCT T.amount) * C.price as treasuries,
        count(DISTINCT R.id) as reports
      FROM coins C
      LEFT JOIN defi_protocols P ON P.coin_id = C.id
      LEFT JOIN funds_invested F ON F.coin_id = C.id
      LEFT JOIN treasuries T ON T.coin_id = C.id
      LEFT JOIN reports R on R.coin_id = C.id
      WHERE C.uid = :uid
      GROUP BY C.id, P.tvl, P.tvl_rank
    `)

    const [coin] = await Coin.query(query, { uid })
    return coin
  }

  static async getPerformance(uid, price7d, price30d) {
    const [bitcoin, ethereum] = await Coin.query(`
      SELECT price_change
        FROM coins
       WHERE coins.uid IN ('bitcoin', 'ethereum')
       ORDER BY id
    `)

    const btcPriceChange = bitcoin.price_change || {}
    const ethPriceChange = ethereum.price_change || {}
    const roi = (price1, price2) => {
      return ((100 + price1) / (100 + price2) - 1) * 100
    }

    const performance = {
      usd: {
        '7d': utils.nullOrString(price7d),
        '30d': utils.nullOrString(price30d)
      }
    }

    if (uid !== 'bitcoin') {
      performance.btc = {
        '7d': utils.nullOrString(roi(price7d, btcPriceChange['7d'])),
        '30d': utils.nullOrString(roi(price30d, btcPriceChange['30d']))
      }
    }

    if (uid !== 'ethereum') {
      performance.eth = {
        '7d': utils.nullOrString(roi(price7d, ethPriceChange['7d'])),
        '30d': utils.nullOrString(roi(price30d, ethPriceChange['30d'])),
      }
    }

    return performance
  }

  static async getTopMovers() {
    const [movers] = await Coin.query(`
      with top_coins as (
        SELECT
          uid,
          price,
          price_change_24h,
          market_data->'market_cap_rank' as market_cap_rank
        FROM coins
        ORDER BY market_data->'market_cap' desc nulls last
        LIMIT 300
      ),
      gainers_100 as (SELECT * FROM (select * FROM top_coins LIMIT 100) t1 ORDER BY price_change_24h desc nulls last LIMIT 5),
      losers_100  as (SELECT * FROM (select * FROM top_coins LIMIT 100) t2 ORDER BY price_change_24h asc  nulls last LIMIT 5),
      gainers_200 as (SELECT * FROM (select * FROM top_coins LIMIT 200) t3 ORDER BY price_change_24h desc nulls last LIMIT 5),
      losers_200  as (SELECT * FROM (select * FROM top_coins LIMIT 200) t4 ORDER BY price_change_24h asc  nulls last LIMIT 5),
      gainers_300 as (SELECT * FROM (select * FROM top_coins LIMIT 300) t5 ORDER BY price_change_24h desc nulls last LIMIT 5),
      losers_300  as (SELECT * FROM (select * FROM top_coins LIMIT 300) t6 ORDER BY price_change_24h asc  nulls last LIMIT 5)
      SELECT jsonb_build_object(
        'gainers_100', (select json_agg(gainers_100.*) from gainers_100),
        'losers_100',  (select json_agg(losers_100.* ) from losers_100),
        'gainers_200', (select json_agg(gainers_200.*) from gainers_200),
        'losers_200',  (select json_agg(losers_200.* ) from losers_200),
        'gainers_300', (select json_agg(gainers_300.*) from gainers_300),
        'losers_300',  (select json_agg(losers_300.* ) from losers_300)
      ) as data
    `)

    if (!movers) {
      return {
        gainers_100: [],
        losers_100: [],
        gainers_200: [],
        losers_200: [],
        gainers_300: [],
        losers_300: []
      }
    }

    return movers.data
  }

  static async getTopMoversBy(field, uids, order = 'desc', limit = 3) {
    let orderField = 'price_change_24h'
    if (field === 'volume') {
      orderField = 'total_volume'
    } else if (field === 'mcap') {
      orderField = 'market_cap'
    } else if (field === 'price_change_1d') {
      orderField = 'price_change_1d'
    } else if (field === 'price_change_1w') {
      orderField = 'price_change_1w'
    } else if (field === 'price_change_1m') {
      orderField = 'price_change_1m'
    } else if (field === 'price_change_3m') {
      orderField = 'price_change_3m'
    }

    const result = await Coin.query(`
      with top_coins as (
        SELECT
          uid,
          name,
          code,
          price,
          img_path,
          price_change->'1d' price_change_1d,
          price_change->'24h' price_change_24h,
          price_change->'7d' price_change_1w,
          price_change->'30d' price_change_1m,
          price_change->'90d' price_change_3m,
          market_data->'market_cap' as market_cap,
          market_data->'market_cap_rank' as market_cap_rank
        FROM coins ${uids ? 'where uid in(:uids)' : ''}
        ORDER BY market_data->'market_cap' desc nulls last
        LIMIT 100
      )
      SELECT * FROM top_coins ORDER BY ${orderField} ${order} nulls last LIMIT :limit
    `, { uids, limit })

    if (!result) {
      return []
    }

    return result
  }

  static async getPlatforms(uid) {
    const [coin] = await Coin.query(`
      SELECT
        c.id,
        c.market_data->'market_cap' as market_cap,
        array_agg(p.id) as platforms
      FROM coins c
      LEFT JOIN platforms p on p.coin_id = c.id
      WHERE c.uid = :uid
      GROUP BY 1
    `, { uid })

    return coin
  }

  static updateCoins(values) {
    const query = `
      UPDATE coins AS c set
        price = v.price,
        price_change = v.price_change::json,
        market_data = v.market_data::json,
        last_updated = v.last_updated::timestamptz
      FROM (values :values) as v(id, price, price_change, market_data, last_updated)
      WHERE c.id = v.id
    `

    return Coin.queryUpdate(query, { values })
  }

  static updatePrices(values) {
    const query = `
      UPDATE coins AS c set
        price = v.price,
        last_updated = v.last_updated::timestamptz
      FROM (values :values) as v(id, price, last_updated)
      WHERE c.id = v.id
    `

    return Coin.queryUpdate(query, { values })
  }

  static updateStats(values) {
    const query = `
      UPDATE coins AS c set
        stats = v.stats::json
      FROM (values :values) as v(id, stats)
      WHERE c.id = v.id
    `

    return Coin.queryUpdate(query, { values })
  }
}

module.exports = Coin
