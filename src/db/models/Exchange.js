const SequelizeModel = require('./SequelizeModel')
const { reduceMap } = require('../../utils')

class Exchange extends SequelizeModel {
  static init(sequelize, DataTypes) {
    return super.init(
      {
        id: {
          type: DataTypes.STRING,
          primaryKey: true
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false
        },
        url: DataTypes.STRING,
        image: DataTypes.TEXT,
        trust_score: DataTypes.INTEGER,
        trust_score_rank: DataTypes.INTEGER,
        volume_24h_btc: DataTypes.DECIMAL,
        centralized: DataTypes.BOOLEAN
      },
      {
        timestamps: false,
        tableName: 'exchanges',
        sequelize
      }
    )
  }

  static async getMappedCentralized(uids) {
    const records = await Exchange.query('select id, centralized from exchanges where id IN(:uids)', { uids })
    return reduceMap(records, 'id', 'centralized')
  }
}

module.exports = Exchange
