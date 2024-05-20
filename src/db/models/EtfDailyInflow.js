const SequelizeModel = require('./SequelizeModel')

class EtfDailyInflow extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        date: {
          type: DataTypes.DATE,
          allowNull: false
        },
        dailyInflow: DataTypes.DECIMAL,
        dailyAssets: DataTypes.DECIMAL
      },
      {
        sequelize,
        tableName: 'etf_daily_inflow',
        indexes: [{
          unique: true,
          fields: ['date', 'etf_id']
        }],
        timestamps: false
      }
    )
  }

  static associate(models) {
    EtfDailyInflow.belongsTo(models.Etf, {
      foreignKey: 'etf_id'
    })
  }

  static async getSum(dateFrom, ticker, interval) {
    const [data] = await EtfDailyInflow.query(`
      SELECT sum(i.daily_assets) assets, sum(i.daily_inflow) inflow
        FROM etf_daily_inflow i, etf e
       WHERE e.ticker = :ticker
         AND e.id = i.etf_id
         AND i.date >= :dateFrom
    `, { dateFrom, ticker })

    if (!data) {
      return {}
    }

    return {
      [`${interval}_assets`]: data.assets,
      [`${interval}_inflow`]: data.inflow
    }
  }

  static async getByDate(dateFrom, ticker) {
    const [data] = await EtfDailyInflow.query(`
      SELECT i.etf_id, i.daily_assets assets, i.daily_inflow inflow
        FROM etf_daily_inflow i, etf e
       WHERE e.ticker = :ticker
         AND e.id = i.etf_id
         AND i.date = :dateFrom
       ORDER BY i.date DESC
    `, { dateFrom, ticker })

    return data
  }

  static async exists() {
    return !!await EtfDailyInflow.findOne()
  }

}

module.exports = EtfDailyInflow
