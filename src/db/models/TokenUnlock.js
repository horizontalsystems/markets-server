const Sequelize = require('sequelize')
const SequelizeModel = require('./SequelizeModel')
const Coin = require('./Coin')

class TokenUnlock extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        coin_uid: {
          type: DataTypes.STRING(50),
          allowNull: false,
          references: {
            key: 'uid',
            model: Coin,
            deferrable: Sequelize.Deferrable.INITIALLY_IMMEDIATE
          }
        },
        circulation: DataTypes.DECIMAL,
        locked: DataTypes.DECIMAL,
        locked_percent: DataTypes.DECIMAL,
        unlocked: DataTypes.DECIMAL,
        unlocked_percent: DataTypes.DECIMAL,
        next_unlock: DataTypes.JSONB,
        next_unlock_percent: DataTypes.DECIMAL,
        date: DataTypes.DATE,
      },
      {
        timestamps: false,
        tableName: 'token_unlocks',
        sequelize,
        indexes: [{
          unique: true,
          fields: ['coin_uid', 'date']
        }]
      }
    )
  }

  static associate(models) {
    TokenUnlock.belongsTo(models.Coin, {
      foreignKey: 'coin_uid'
    })
  }

  static getListCoins() {
    return TokenUnlock.query(`
      select
        p.*,
        c.uid as coin_uid
      from platforms p, coins c
      where c.id = p.coin_id
    `)
  }

}

module.exports = TokenUnlock
