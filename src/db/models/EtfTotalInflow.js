const SequelizeModel = require('./SequelizeModel')

class EtfTotalInflow extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        date: {
          type: DataTypes.DATEONLY,
          unique: true,
          allowNull: false
        },
        totalAssets: DataTypes.DECIMAL,
        totalInflow: DataTypes.DECIMAL,
        totalDailyInflow: DataTypes.DECIMAL,
        totalDailyVolume: DataTypes.DECIMAL
      },
      {
        sequelize,
        tableName: 'etf_total_inflow',
        timestamps: false
      }
    )
  }

  static async exists() {
    return !!await EtfTotalInflow.findOne()
  }

}

module.exports = EtfTotalInflow
