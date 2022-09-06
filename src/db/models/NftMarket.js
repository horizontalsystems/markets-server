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

  static async getStatsChart(collectionUid, dateFrom, interval = '1h') {
    const query = (`
      SELECT
        DISTINCT ON (nm.trunc)
        nm.trunc as timestamp,
        nm.volume24h as one_day_volume,
        nm.avg_price as average_price,
        nm.floor_price as floor_price,
        nm.sales24h as one_day_sales
      FROM (
        SELECT
          m.*,
          ${this.truncateDateWindow('date', interval)} AS trunc
          FROM nft_markets m, nft_collections c
          WHERE c.uid = :collectionUid
            AND m.collection_id = c.id
            AND m.date >= :dateFrom
      ) nm
      ORDER BY nm.trunc, nm.date DESC`
    )

    return NftMarket.query(query, { collectionUid, dateFrom })
  }
}

module.exports = NftMarket
