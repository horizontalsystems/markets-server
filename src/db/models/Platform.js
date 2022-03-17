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

  static async findByCoinUID(uid, type = 'erc20') {
    const query = (`
      SELECT P.id, P.type
        FROM platforms P, coins C
      WHERE C.uid = :uid
        AND type = :type
        AND C.id = P.coin_id
    `)

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

  static getBalances(values, chain) {
    if (!values.length) {
      return []
    }

    let platform
    switch (chain) {
      case 'bsc':
        platform = 'bep20'
        break
      case 'matic':
        platform = 'polygon-pos'
        break
      default:
        platform = 'erc20'
    }

    const query = `
      SELECT
        V.value,
        V.address,
        C.price
     FROM (values :values) as V(address, value) 
     JOIN platforms P on P.address = V.address
     JOIN coins C on C.id = P.coin_id
     WHERE type = :platform
     ORDER BY C.code
    `

    return Platform.query(query, { values, platform })
  }

}

module.exports = Platform
