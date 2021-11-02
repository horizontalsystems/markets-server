const SequelizeModel = require('./SequelizeModel')

class Treasury extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        type: DataTypes.ENUM('public', 'private', 'etf'),
        amount: DataTypes.DECIMAL,
        country: DataTypes.STRING
      },
      {
        timestamps: false,
        tableName: 'treasuries',
        sequelize
      }
    )
  }

  static associate(models) {
    Treasury.belongsTo(models.Coin, {
      foreignKey: 'coin_id'
    })
    Treasury.belongsTo(models.Fund, {
      foreignKey: 'fund_id'
    })
  }

  static getByCoin(uid) {
    const query = `
      SELECT
        T.*, 
        T.amount * C.price as amount_usd,
        F.name as fund
      FROM treasuries T 
      JOIN funds F ON F.id = T.fund_id 
      JOIN coins C ON C.id = T.coin_id AND C.uid = :uid
    `
    return Treasury.query(query, { uid })
  }

}

module.exports = Treasury
