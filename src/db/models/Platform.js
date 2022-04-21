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
        decimals: DataTypes.INTEGER,
        circulating_supply: DataTypes.DECIMAL
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

  static async findByCoinUID(uids, type = '') {
    const query = (`
      SELECT P.*
        FROM platforms P, coins C
      WHERE C.uid in (:uids)
        AND C.id = P.coin_id
        AND P.type LIKE :type
    `)

    return Platform.query(query, { uids, type: `%${type}` })
  }

  static getByTypes(type, withDecimal, withAddress = true) {
    const where = {}

    if (type) {
      where.type = type
    }

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

  static getMarketCap(uids) {
    const query = `
      SELECT
        p.id,
        c.uid,
        p.type,
        p.address,
        p.decimals,
        c.market_data->'circulating_supply' csupply,
        c.market_data->'market_cap' mcap,
        m.coin_id as multi_chain_id
      FROM platforms p
      JOIN coins c on c.id = p.coin_id
          ${uids ? 'and c.uid in (:uids)' : ''} 
      LEFT JOIN (
        SELECT
          coin_id
        FROM platforms
        GROUP BY coin_id
        HAVING COUNT(*) > 1
      ) m ON m.coin_id = p.coin_id
      WHERE p.address is not null
    `

    return Platform.query(query, { uids })
  }

  static updateCSupplies(values) {
    const query = `
      UPDATE platforms AS p 
        set circulating_supply = v.csupply
      FROM (values :values) as v(id, csupply)
      WHERE p.id = v.id::int
    `

    return Platform.queryUpdate(query, { values })
  }

}

module.exports = Platform
