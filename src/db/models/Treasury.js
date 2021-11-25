const SequelizeModel = require('./SequelizeModel')

class Treasury extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        amount: DataTypes.DECIMAL
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
    Treasury.belongsTo(models.TreasuryEntity, {
      foreignKey: 'treasury_entity_id'
    })
  }

  static getByCoin(uid) {
    const query = `
      SELECT
        E.*,
        T.amount, 
        T.amount * C.price as amount_usd
      FROM treasuries T 
      JOIN treasury_entities E ON E.id = T.treasury_entity_id 
      JOIN coins C ON C.id = T.coin_id AND C.uid = :uid
    `
    return Treasury.query(query, { uid })
  }

}

module.exports = Treasury
