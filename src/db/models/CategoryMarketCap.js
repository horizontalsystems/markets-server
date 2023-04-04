const SequelizeModel = require('./SequelizeModel')

class CategoryMarketCap extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        market_cap: {
          type: DataTypes.DECIMAL,
          allowNull: false
        },
        date: {
          type: DataTypes.DATE,
          allowNull: false
        }
      },
      {
        sequelize,
        tableName: 'category_market_caps',
        indexes: [{
          unique: true,
          fields: ['date', 'category_id']
        }]
      }
    )
  }

  static associate(models) {
    CategoryMarketCap.belongsTo(models.Category, {
      foreignKey: 'category_id'
    })
  }

  static async exists() {
    return !!await CategoryMarketCap.findOne()
  }

  static async getByCategory(uid, window, dateFrom) {
    const query = (`
      SELECT
        t2.timestamp,
        t1.market_cap
      FROM category_market_caps t1
      JOIN categories C on C.uid = :uid
      JOIN (
        SELECT
          ${this.truncateDateWindow('date', window)} as timestamp,
          max(id) as max_id,
          max(date) as max_date,
          category_id
         FROM category_market_caps
        WHERE date >= :dateFrom
        GROUP by timestamp, category_id
      ) t2 ON (t1.id = t2.max_id AND t1.date = t2.max_date AND t2.category_id = C.id)
      ORDER BY date
    `)

    return CategoryMarketCap.query(query, { dateFrom, uid })
  }

  static getLastPoints(dateFrom) {
    return CategoryMarketCap.query(`
      SELECT
        DISTINCT ON (t1.category_id)
        t1.*
      FROM category_market_caps t1
      JOIN (
        SELECT
          category_id, id, max(date) AS max_date
        FROM category_market_caps
          where date <= :dateFrom
        GROUP BY category_id, id
        ORDER BY date DESC
      ) t2
      ON t1.id = t2.id AND t1.category_id = t2.category_id
      ORDER BY t1.category_id, date DESC
    `, { dateFrom })
  }

  static getByDate(date) {
    return CategoryMarketCap.query('SELECT * FROM category_market_caps WHERE date = :date', { date })
  }

  static deleteExpired(dateFrom, dateTo) {
    return CategoryMarketCap.query('DELETE FROM category_market_caps WHERE date > :dateFrom AND date < :dateTo', {
      dateFrom,
      dateTo
    })
  }
}

module.exports = CategoryMarketCap
