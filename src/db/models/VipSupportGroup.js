const SequelizeModel = require('./SequelizeModel')

class VipSupportGroup extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        subscription_id: {
          type: DataTypes.STRING(3000),
          allowNull: false,
          primaryKey: true
        },
        subscription_deadline: {
          type: DataTypes.DATE,
          allowNull: false
        },
        group_id: {
          type: DataTypes.STRING,
          allowNull: false
        },
        group_link: {
          type: DataTypes.TEXT,
          allowNull: false
        },
      },
      {
        sequelize,
        tableName: 'vip_support_groups'
      }
    )
  }
}

module.exports = VipSupportGroup
