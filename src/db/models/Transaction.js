const SequelizeModel = require('./SequelizeModel')

class Transaction extends SequelizeModel {

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
        expires_at: DataTypes.DATE
      },
      {
        sequelize,
        tableName: 'transactions',
        indexes: [{
          unique: true,
          fields: ['date', 'platform_id']
        }]
      }
    )
  }

  static associate(models) {
    Transaction.belongsTo(models.Platform, {
      foreignKey: 'platform_id'
    })
  }

  static async exists() {
    return !!await Transaction.findOne()
  }

  static updatePoints(dateFrom, dateTo) {
    return Transaction.query(`
      UPDATE transactions
      SET volume = total.volume,
          count = total.count
      FROM (SELECT 
            SUM(volume) as volume,  SUM(count) as count
            FROM transactions
            WHERE date > :dateFrom AND date <= :dateTo
           ) AS total
      WHERE date = :dateTo`, {
      dateFrom,
      dateTo
    })
  }

  static deleteExpired(dateFrom, dateTo) {
    return Transaction.query('DELETE FROM transactions WHERE date > :dateFrom AND date < :dateTo', {
      dateFrom,
      dateTo
    })
  }

}

module.exports = Transaction
