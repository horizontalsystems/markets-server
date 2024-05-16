const SequelizeModel = require('./SequelizeModel')

class EtfInflow extends SequelizeModel {

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
        tableName: 'etf_inflow',
        timestamps: false
      }
    )
  }

  static async exists() {
    return !!await EtfInflow.findOne()
  }

}

module.exports = EtfInflow
