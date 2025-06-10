const SequelizeModel = require('./SequelizeModel')

class Stock extends SequelizeModel {
  static init(sequelize, DataTypes) {
    return super.init(
      {
        symbol: {
          type: DataTypes.STRING,
          primaryKey: true
        },
        uid: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false
        },
        market_price: {
          type: DataTypes.DECIMAL,
          allowNull: false
        },
        price_change: {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: {}
        }
      },
      {
        sequelize,
        timestamps: false,
        tableName: 'stocks',
        indexes: [{
          fields: ['uid']
        }]
      }
    )
  }
}

module.exports = Stock
