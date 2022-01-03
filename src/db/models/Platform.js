const SequelizeModel = require('./SequelizeModel')

class Platform extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        type: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        symbol: DataTypes.STRING(100),
        address: DataTypes.STRING(100),
        decimals: DataTypes.INTEGER
      },
      {
        timestamps: false,
        tableName: 'platforms',
        sequelize,
        indexes: [{
          unique: true,
          fields: ['coin_id', 'type']
        }]
      }
    )
  }

  static associate(models) {
    Platform.belongsTo(models.Coin, {
      foreignKey: 'coin_id'
    })
  }

  static async findByCoinUID(uid, type) {
    const query = `
      SELECT P.id, P.type
        FROM platforms P, coins C
      WHERE C.uid = :uid
        AND C.id = P.coin_id
        ${type ? 'AND type = :type' : ''}
    `

    return Platform.query(query, { uid, type })
  }

  static getByTypes(type, withDecimal, withAddress = true) {
    const where = { type }

    if (withDecimal) {
      where.decimals = Platform.literal('decimals IS NOT NULL')
    }

    if (withAddress) {
      where.address = Platform.literal('address IS NOT NULL')
    }

    return Platform.findAll({ where })
  }

}

module.exports = Platform
