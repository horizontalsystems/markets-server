const SequelizeModel = require('./SequelizeModel')

class Etf extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        ticker: {
          type: DataTypes.STRING,
          unique: true,
          allowNull: false
        },
        uid: DataTypes.STRING,
        name: DataTypes.STRING,
        category: DataTypes.STRING,
        exchange: DataTypes.STRING,
        institution: DataTypes.STRING,
        price: DataTypes.DECIMAL,
        totalAssets: DataTypes.DECIMAL,
        totalInflow: DataTypes.DECIMAL,
        dailyInflow: DataTypes.DECIMAL,
        dailyVolume: DataTypes.DECIMAL,
        changes: DataTypes.JSONB,
        // {
        //  1d_assets: 10,
        //  1d_inflow: 10,
        //  1w_assets: 10,
        //  1w_inflow: 10,
        //  1m_assets: 10,
        //  1m_inflow: 10,
        //  3m_assets: 10,
        //  3m_inflow: 10'
        // }
        date: DataTypes.DATEONLY
      },
      {
        sequelize,
        tableName: 'etf',
        timestamps: false
      }
    )
  }

  static associate(models) {
    Etf.hasMany(models.EtfDailyInflow)
  }

  static async exists() {
    return !!await Etf.findOne()
  }

  static async expiredItems(dateFrom) {
    return Etf.query('select date, ticker from etf where date < :dateFrom', { dateFrom })
  }

}

module.exports = Etf
