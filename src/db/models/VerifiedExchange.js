const SequelizeModel = require('./SequelizeModel')
const { reduceMap } = require('../../utils')

class VerifiedExchange extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        uid: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false
        }
      },
      {
        timestamps: false,
        tableName: 'verified_exchanges',
        sequelize
      }
    )
  }

  static async getUids() {
    const records = await VerifiedExchange.query('select id, uid from verified_exchanges')
    return reduceMap(records, 'uid', 'id')
  }
}

module.exports = VerifiedExchange
