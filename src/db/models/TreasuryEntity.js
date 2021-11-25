const SequelizeModel = require('./SequelizeModel')

class TreasuryEntity extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        uid: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true
        },
        name: DataTypes.STRING,
        type: DataTypes.ENUM('public', 'private', 'etf'),
        country: DataTypes.STRING
      },
      {
        timestamps: false,
        tableName: 'treasury_entities',
        sequelize
      }
    )
  }

  static associate() {
  }

}

module.exports = TreasuryEntity
