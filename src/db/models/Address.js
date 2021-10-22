const SequelizeModel = require('./SequelizeModel')

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

  static getLast() {
    return Address.findOne({
      order: [
        ['date', 'DESC']
      ]
    })
  }

  static async exists() {
    return !!await Address.findOne()
  }

  static updatePoints(dateFrom, dateTo) {
    return Address.query(`
      UPDATE addresses
      SET volume = total.volume,
          count = total.count
      FROM (SELECT 
            SUM(volume) as volume,  SUM(count) as count
            FROM addresses
            WHERE date > :dateFrom AND date <= :dateTo
           ) AS total
      WHERE date = :dateTo`, {
      dateFrom,
      dateTo
    })
  }

  static deleteExpired(dateFrom, dateTo) {
    return Address.query('DELETE FROM addresses WHERE date > :dateFrom AND date < :dateTo', {
      dateFrom,
      dateTo
    })
  }

}

module.exports = Address
