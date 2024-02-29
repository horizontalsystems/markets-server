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
}

module.exports = CoinIndicator
