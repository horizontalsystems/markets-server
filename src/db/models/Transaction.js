const Sequelize = require('sequelize')

class Transaction extends Sequelize.Model {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        date: {
          type: DataTypes.STRING(10), // s
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
        ['id', 'DESC']
      ]
    })
  }
}

module.exports = Transaction
