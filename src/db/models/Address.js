const Sequelize = require('sequelize')

class Address extends Sequelize.Model {

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
        }
      },
      {
        sequelize,
        tableName: 'addresses'
      }
    )
  }

  static getLast() {
    return Address.findOne({
      order: [
        ['date', 'DESC']
      ]
    })
  }
}

module.exports = Address
