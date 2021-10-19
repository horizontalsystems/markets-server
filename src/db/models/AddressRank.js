const SequelizeModel = require('./SequelizeModel')

class AddressRank extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        address: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        volume: {
          type: DataTypes.DECIMAL,
          allowNull: false
        }
      },
      {
        sequelize,
        tableName: 'address_ranks',
      }
    )
  }

  static associate(models) {
    AddressRank.belongsTo(models.Platform, {
      foreignKey: 'platform_id'
    })
  }

  static async exists() {
    return !!await AddressRank.findOne()
  }

  static deleteAll() {
    return AddressRank.query('DELETE FROM address_ranks')
  }

}

module.exports = AddressRank
