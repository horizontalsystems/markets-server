const SequelizeModel = require('./SequelizeModel')

class Exchange extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        uid: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false
        }
      },
      {
        timestamps: false,
        tableName: 'exchanges',
        sequelize
      }
    )
  }

}

module.exports = Exchange
