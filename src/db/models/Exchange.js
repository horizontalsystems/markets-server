const SequelizeModel = require('./SequelizeModel')
const { reduceMap } = require('../../utils')

class Exchange extends SequelizeModel {

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
        tableName: 'exchanges',
        sequelize
      }
    )
  }

  static async getUids() {
    const records = await Exchange.query('select id, uid from exchanges')
    return reduceMap(records, 'uid', 'id')
  }

}

module.exports = Exchange
