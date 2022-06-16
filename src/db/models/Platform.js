const Sequelize = require('sequelize')
const SequelizeModel = require('./SequelizeModel')
const Chain = require('./Chain')

class Platform extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        type: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        chain_uid: {
          type: DataTypes.STRING(50),
          allowNull: false,
          references: {
            key: 'uid',
            model: Chain,
            deferrable: Sequelize.Deferrable.INITIALLY_IMMEDIATE
          }
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
          fields: ['coin_id', 'chain_uid', 'type']
        }]
      }
    )
  }

  static associate(models) {
    Platform.belongsTo(models.Coin, {
      foreignKey: 'coin_id'
    })
  }

  static getListCoins() {
    return Platform.query(`
      select
        p.*,
        c.uid as coin_uid
      from platforms p, coins c
      where c.id = p.coin_id
    `)
  }

  static findByCoinUID(uids, chain = '') {
    const query = (`
      SELECT P.*
        FROM platforms P, coins C
      WHERE C.uid in (:uids)
        AND C.id = P.coin_id
        AND P.chain_uid LIKE :chain
    `)

    return Platform.query(query, { uids, chain: `%${chain}` })
  }

  static getByChain(chain, withDecimal, withAddress = true) {
    const where = {}

    if (chain) {
      where.chain_uid = chain
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

    const query = `
      SELECT
        V.value,
        V.address,
        C.price
     FROM (values :values) as V(address, value)
     JOIN platforms P on P.address = V.address
     JOIN coins C on C.id = P.coin_id
     WHERE chain_uid = :chain
     ORDER BY C.code
    `

    return Platform.query(query, { values, chain })
  }

  static getMarketCap(uids) {
    const query = `
      SELECT
        p.id,
        c.uid,
        p.type,
        p.chain_uid,
        p.address,
        p.decimals,
        c.market_data->'circulating_supply' csupply,
        c.market_data->'market_cap' mcap,
        m.coin_id as multi_chain_id
      FROM platforms p
      JOIN coins c on c.id = p.coin_id ${uids ? 'and c.uid in (:uids)' : ''} 
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
