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
        expires_at: {
          type: DataTypes.DATE,
          allowNull: false
        }
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

  static getLast() {
    return Transaction.findOne({
      order: [
        ['date', 'DESC']
      ]
    })
  }

  static deleteExpired() {
    return Transaction.query('DELETE FROM transactions where expires_at <= NOW()')
  }

}

module.exports = Transaction
