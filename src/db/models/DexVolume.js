const SequelizeModel = require('./SequelizeModel')

class DexVolume extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        date: {
          type: DataTypes.DATE,
          allowNull: false
        },
        volume: {
          type: DataTypes.DECIMAL,
          allowNull: false
        },
        exchange: {
          type: DataTypes.STRING,
          allowNull: false
        },
        expires_at: DataTypes.DATE
      },
      {
        sequelize,
        tableName: 'dex_volumes',
        indexes: [{
          unique: true,
          fields: ['date', 'platform_id', 'exchange']
        }]
      }
    )
  }

  static associate(models) {
    DexVolume.belongsTo(models.Platform, {
      foreignKey: 'platform_id'
    })
  }

  static deleteExpired() {
    return DexVolume.query('DELETE FROM dex_volumes where expires_at <= NOW()')
  }

}

module.exports = DexVolume
