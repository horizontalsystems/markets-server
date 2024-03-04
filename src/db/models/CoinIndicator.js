const SequelizeModel = require('./SequelizeModel')

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
