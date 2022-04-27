const { Model } = require('sequelize')

class AddressLabel extends Model {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        address: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true
        },
        label: {
          type: DataTypes.STRING,
          allowNull: false
        }
      },
      {
        timestamps: false,
        tableName: 'address_labels',
        sequelize
      }
    )
  }

}

module.exports = AddressLabel
