const SequelizeModel = require('./SequelizeModel')
const Platform = require('./Platform')
const Coin = require('./Coin')

class Address extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        count: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
        volume: {
          type: DataTypes.DECIMAL,
          allowNull: false
        },
        date: {
          type: DataTypes.DATE,
          allowNull: false
        },
        expires_at: {
          type: DataTypes.DATE
        }
      },
      {
        sequelize,
        tableName: 'addresses',
        indexes: [{
          unique: true,
          fields: ['date', 'platform_id']
        }]
      }
    )
  }

  static associate(models) {
    Address.belongsTo(models.Platform, {
      foreignKey: 'platform_id'
    })
  }

  static async exists() {
    return !!await Address.findOne()
  }

  static async existsForPlatforms(platforms) {
    const query = `
      SELECT COUNT(*)
      FROM addresses a , platforms p
      WHERE a.platform_id = p.id AND p.type IN (:platforms)
    `
    const [result] = await Address.query(query, { platforms })
    return result
  }

  static async getByCoinUid(uid, window, dateFrom) {
    const platform = await Platform.findByCoinUID(uid)
    if (!platform) {
      return []
    }

    const query = `
      SELECT
        ${this.truncateDateWindow('date', window)} as date,
        SUM(count) AS count,
        SUM(volume) AS volume
      FROM addresses
      WHERE platform_id = :platform_id
        and date >= :dateFrom
      GROUP by 1
      ORDER BY date ASC
    `

    return Address.query(query, { dateFrom, platform_id: platform.id })
  }

  static async getCoinHolders(uid, platform = 'erc20', limit = 10) {
    const coin = await Coin.getMarketData(uid, platform)
    if (!coin || !coin.market_data) {
      return null
    }

    const supply = coin.market_data.total_supply || coin.market_data.circulating_supply

    if (!supply) {
      return []
    }

    const query = `
      SELECT
        address,
        balance
      FROM coin_holders
      WHERE platform_id = :platform_id
      ORDER BY balance DESC
      LIMIT :limit
    `

    const holders = await Address.query(query, {
      platform_id: coin.platform_id,
      limit
    })

    return holders.map(item => ({
      address: item.address,
      share: (item.balance * 100) / parseFloat(supply)
    }))
  }

  static updatePoints(dateFrom, dateTo) {
    const query = `
      UPDATE addresses
      SET volume = total.volume, count = total.count
      FROM (
        SELECT
          SUM(volume) as volume,  SUM(count) as count
          FROM addresses
          WHERE date > :dateFrom AND date <= :dateTo
        ) AS total
      WHERE date = :dateTo
    `

    return Address.query(query, { dateFrom, dateTo })
  }

  static deleteExpired(dateFrom, dateTo) {
    return Address.query('DELETE FROM addresses WHERE date > :dateFrom AND date < :dateTo', {
      dateFrom,
      dateTo
    })
  }

}

module.exports = Address
