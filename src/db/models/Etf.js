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
        exchange: DataTypes.STRING,
        institution: DataTypes.STRING,
        price: DataTypes.DECIMAL,
        totalAssets: DataTypes.DECIMAL,
        totalInflow: DataTypes.DECIMAL,
        dailyInflow: DataTypes.DECIMAL,
        dailyVolume: DataTypes.DECIMAL,
        changes: DataTypes.JSONB,
        // {
        //   1d: 10%,
        //   1w: 20%
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
    return Etf.query('select ticker from etf where date < :dateFrom', { dateFrom })
  }

}

module.exports = Etf
