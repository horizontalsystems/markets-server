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
        chain: {
          type: DataTypes.STRING(50),
          allowNull: false
        },
        expire_date: {
          type: DataTypes.DATE
        },
        login_date: {
          type: DataTypes.DATE
        }
      },
      {
        timestamps: false,
        tableName: 'subscriptions',
        sequelize,
        indexes: [{
          unique: true,
          fields: ['address', 'chain']
        }]
      }
    )
  }

  static getActive(address) {
    const query = `
      SELECT *
      FROM subscriptions
      WHERE address IN (:address)
        AND expire_date IS NOT NULL
        AND expire_date > NOW()
    `
    return Subscription.query(query, { address })
  }

  static getInactive() {
    return Subscription.query('SELECT * FROM subscriptions WHERE expire_date IS NULL')
  }

}

module.exports = Subscription
