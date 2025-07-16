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
        amount: DataTypes.DECIMAL,
        country: DataTypes.STRING,
        coin_uid: DataTypes.STRING,
        is_private: DataTypes.BOOLEAN,
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
