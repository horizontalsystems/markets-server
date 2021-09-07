const Sequelize = require('sequelize')

class Transaction extends Sequelize.Model {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        date: {
          type: DataTypes.DATE,
          allowNull: false,
          unique: true
        },
        count: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
        volume: {
          type: DataTypes.DECIMAL,
          allowNull: false
        }
      },
      {
        sequelize,
        tableName: 'transactions'
      }
    )
  }

  static getLast() {
    return Transaction.findOne({
      order: [
        ['date', 'DESC']
      ]
    })
  }
}

module.exports = Transaction
