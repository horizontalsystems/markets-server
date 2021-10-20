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
  }

  static getByCoin(uid) {
    const query = `
      SELECT
        T.*, 
        T.amount * C.price as amount_usd
      FROM treasuries T 
      JOIN coins C ON C.id = T.coin_id AND C.uid = :uid
    `
    return Treasury.query(query, { uid })
  }

}

module.exports = Treasury
