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
