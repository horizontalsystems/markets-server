const SequelizeModel = require('./SequelizeModel')

class Currency extends SequelizeModel {

  static get baseCurrency() {
    return 'usd'
  }

  static init(sequelize, DataTypes) {
    return super.init(
      {
        code: {
          type: DataTypes.STRING(6),
          allowNull: false,
          unique: true
        },
        name: DataTypes.STRING(30),
      },
      {
        sequelize,
        tableName: 'currencies'
      }
    )
  }

  static getCurrencyCodes() {
    return Currency.query(`SELECT code FROM currencies where code<>\\'${this.baseCurrency}'`)
  }

}

module.exports = Currency
