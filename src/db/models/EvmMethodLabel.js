const { Model } = require('sequelize')

class EvmMethodLabel extends Model {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        method_id: {
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
        tableName: 'evm_method_labels',
        sequelize
      }
    )
  }

}

module.exports = EvmMethodLabel
