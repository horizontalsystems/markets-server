const SequelizeModel = require('./SequelizeModel')

class TreasuryCompany extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        uid: {
          type: DataTypes.STRING,
          primaryKey: true,
        },
        name: DataTypes.STRING,
        code: DataTypes.STRING,
        amount: DataTypes.DECIMAL,
        country: DataTypes.STRING,
        coin_uid: DataTypes.STRING,
        type: DataTypes.STRING
      },
      {
        timestamps: false,
        tableName: 'treasury_companies',
        sequelize
      }
    )
  }

  static associate() {
  }
}

module.exports = TreasuryCompany
