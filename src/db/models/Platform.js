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

  static getBalances(values) {
    if (!values.length) {
      return []
    }

    const query = `
      SELECT
        V.value,
        V.address,
        C.price
     FROM (values :values) as V(address, value) 
     JOIN platforms P on P.address = V.address
     JOIN coins C on C.id = P.coin_id
     ORDER BY C.code
    `

    return Platform.query(query, { values })
  }

}

module.exports = Platform
