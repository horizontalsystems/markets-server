const SequelizeModel = require('./SequelizeModel')
const { mapToField } = require('../../utils')

class CoinIndicator extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        id: {
          type: DataTypes.BIGINT,
          autoIncrement: true,
          primaryKey: true
        },
        indicators: DataTypes.JSONB,
        result: DataTypes.STRING,
        signal_timestamp: DataTypes.INTEGER,
      },
      {
        sequelize,
        tableName: 'coin_indicators',
        indexes: [{
          unique: true,
          fields: ['coin_id']
        }]
      }
    )
  }

  static associate(models) {
    CoinIndicator.belongsTo(models.Coin, {
      foreignKey: 'coin_id'
    })
  }

  static async getResultsMap() {
    const records = await CoinIndicator.query('select coin_id, result from coin_indicators')
    return mapToField(records, 'coin_id', 'result')
  }

  static async getCoinsSignals(uids) {
    return CoinIndicator.query('select uid, result from coin_indicators i, coins c where c.id = i.coin_id and c.uid in (:uids)', { uids })
  }

  static async getByCoin(id) {
    const indicator = await CoinIndicator.findOne({
      where: {
        coin_id: id
      },
      raw: true
    })

    if (!indicator) {
      return null
    }

    const result = {
      ...indicator.indicators,
      state: indicator.result,
      signal_timestamp: indicator.signal_timestamp
    }

    if (indicator.signal_timestamp) {
      result.signal_timestamp = indicator.signal_timestamp
    }

    return result
  }

}

module.exports = CoinIndicator
