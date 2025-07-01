const SequelizeModel = require('./SequelizeModel')

class EtfTotalInflow extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        date: {
          type: DataTypes.DATEONLY,
          allowNull: false
        },
        totalAssets: DataTypes.DECIMAL,
        totalInflow: DataTypes.DECIMAL,
        totalDailyInflow: DataTypes.DECIMAL,
        totalDailyVolume: DataTypes.DECIMAL,
        category: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: 'btc'
        },
      },
      {
        sequelize,
        tableName: 'etf_total_inflow',
        timestamps: false,
        indexes: [{
          unique: true,
          fields: ['date', 'category']
        }]
      }
    )
  }

  static async exists() {
    return !!await EtfTotalInflow.findOne()
  }

}

module.exports = EtfTotalInflow
