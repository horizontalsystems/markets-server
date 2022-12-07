const SequelizeModel = require('./SequelizeModel')

class NftMarket extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        volume24h: {
          type: DataTypes.DECIMAL,
          defaulValue: 0
        },
        total_volume: {
          type: DataTypes.DECIMAL,
          defaulValue: 0
        },
        sales24h: {
          type: DataTypes.DECIMAL,
          defaulValue: 0
        },
        total_sales: {
          type: DataTypes.DECIMAL,
          defaulValue: 0
        },
        floor_price: {
          type: DataTypes.DECIMAL,
          defaulValue: 0
        },
        avg_price: {
          type: DataTypes.DECIMAL,
          defaulValue: 0
        },
        owners: {
          type: DataTypes.INTEGER,
          defaulValue: 0
        },
        date: {
          type: DataTypes.DATE,
          allowNull: false
        }
      },
      {
        sequelize,
        tableName: 'nft_markets',
        indexes: [{
          unique: true,
          fields: ['date', 'collection_id']
        }]
      }
    )
  }

  static associate(models) {
    NftMarket.belongsTo(models.NftCollection, {
      foreignKey: 'collection_id'
    })
  }

  static deleteExpired(dateFrom, dateTo) {
    return NftMarket.query('DELETE FROM nft_markets WHERE date > :dateFrom AND date < :dateTo', {
      dateFrom,
      dateTo
    })
  }

}

module.exports = NftMarket
