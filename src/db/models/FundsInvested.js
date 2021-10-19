const Sequelize = require('sequelize')

class FundsInvested extends Sequelize.Model {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        round: DataTypes.ENUM([
          'Secondary Market',
          'Initial Coin Offering',
          'Venture Round',
          'Series A',
          'Seed Round',
          'Angel Round',
          'Series C',
          'Pre-Seed Round',
          'Funding Round',
          'Series B',
          'Series D',
          'Series E',
          'Private Equity Round',
          'Corporate Round',
        ]),
        amount: DataTypes.DECIMAL,
        date: DataTypes.DATEONLY
      },
      {
        timestamps: false,
        tableName: 'funds_invested',
        sequelize
      }
    )
  }

  static associate(models) {
    FundsInvested.belongsTo(models.Coin)
    FundsInvested.belongsTo(models.Fund)
  }

}

module.exports = FundsInvested
