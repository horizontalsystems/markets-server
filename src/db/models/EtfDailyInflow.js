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

  static async exists() {
    return !!await EtfDailyInflow.findOne()
  }

}

module.exports = EtfDailyInflow
