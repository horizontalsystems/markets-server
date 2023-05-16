const SequelizeModel = require('./SequelizeModel')

class Subscription extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        address: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true
        },
        expire_date: {
          type: DataTypes.DATE,
          allowNull: false
        },
        block_number: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
        login_date: {
          type: DataTypes.DATE
        }
      },
      {
        timestamps: false,
        tableName: 'subscriptions',
        sequelize
      }
    )
  }

}

module.exports = Subscription
