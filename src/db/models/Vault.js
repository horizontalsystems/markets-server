const SequelizeModel = require('./SequelizeModel')

class Vault extends SequelizeModel {
  static init(sequelize, DataTypes) {
    return super.init(
      {
        address: {
          type: DataTypes.STRING,
          primaryKey: true
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false
        },
        apy: {
          type: DataTypes.JSONB,
          // { 1d, 7d, 30d }
        },
        tvl: DataTypes.DECIMAL,
        apy_history: {
          type: DataTypes.JSONB,
          // { "1749513600": 0.0038, ... }
        },
        apy_history_hourly: {
          type: DataTypes.JSONB,
          // { "1749513600": 0.0038, ... }
        },
        chain: DataTypes.STRING,
        asset_symbol: DataTypes.STRING,
        protocol_name: DataTypes.STRING,
        protocol_logo: DataTypes.STRING,
        holders: DataTypes.DECIMAL,
        url: DataTypes.TEXT,
      },
      {
        sequelize,
        timestamps: false,
        tableName: 'vaults',
        // indexes: [{
        //   fields: ['']
        // }]
      }
    )
  }
}

module.exports = Vault
