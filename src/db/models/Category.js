const SequelizeModel = require('./SequelizeModel')

class Category extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        uid: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true
        },
        name: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        order: {
          type: DataTypes.INTEGER,
          defaultValue: 0
        },
        description: DataTypes.JSONB,
        //  {
        //    en: 'Description text',
        //    ru: 'Description text'
        //  }
        market_cap: DataTypes.JSONB,
        // {
        //   change_24h: 2.3,
        //   change_7d: 1.53,
        //   change_30d: 4.5
        //   amount: 100
        // }
        enabled: DataTypes.BOOLEAN
      },
      {
        timestamps: false,
        tableName: 'categories',
        sequelize
      }
    )
  }

  static associate(models) {
    Category.belongsToMany(models.Coin, { through: models.CoinCategories })
  }

  static getCoins(uid) {
    const query = (`
      SELECT C.*
      FROM categories cat, coin_categories M, coins C
      WHERE cat.uid = :uid
        AND M.category_id = cat.id
        AND M.coin_id = C.id
    `)

    return Category.query(query, { uid })
  }

  static getTopCoins(uid) {
    const query = (`
      WITH ranked_coins AS (
        SELECT
          c.uid AS coin_uid,
          cat.*,
          ROW_NUMBER() OVER (
            PARTITION BY cat.id 
            ORDER BY (c.market_data->>'market_cap')::numeric DESC
          ) AS rank
        FROM coin_categories cc
        JOIN coins c ON c.id = cc.coin_id AND c.market_data->>'market_cap' IS NOT NULL
        JOIN categories cat ON cat.id = cc.category_id
        WHERE cat.enabled = true
      )
      SELECT uid, name, market_cap, description, ARRAY_AGG(coin_uid ORDER BY rank) AS top_coins
      FROM ranked_coins
      WHERE rank <= 3
      GROUP BY uid, name, market_cap, description
    `)

    return Category.query(query, { uid })
  }

  static getMarketCaps() {
    const query = (`
      SELECT
        cat.id,
        sum ((c.market_data->'market_cap')::numeric) as market_cap_amount
       FROM categories cat
       JOIN coin_categories cc ON cc.category_id = cat.id
       JOIN coins c ON c.id = cc.coin_id
      GROUP BY cat.id
    `)

    return Category.query(query)
  }

  static updateMarketCaps(values) {
    const query = `
      UPDATE categories AS c set market_cap = v.market_cap::json
      FROM (values :values) as v(id, market_cap)
      WHERE c.id = v.id
    `

    return Category.queryUpdate(query, { values })
  }

  static getTopMovers(uids) {
    if (uids) {
      return Category.findAll({
        attributes: ['uid', 'name', 'market_cap', 'description'],
        where: { uid: uids },
        limit: 5
      })
    }

    return Category.query(`
      SELECT
        uid,
        name,
        market_cap,
        description
      FROM categories
      ORDER BY market_cap->'change_24h' DESC nulls last
      LIMIT 4
    `)
  }

}

module.exports = Category
