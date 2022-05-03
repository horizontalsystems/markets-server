const { Model } = require('sequelize')

class AuthKey extends Model {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        address: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true
        },
        key: {
          type: DataTypes.STRING,
          allowNull: false
        },
        expires_at: {
          type: DataTypes.DATE,
          allowNull: false
        }
      },
      {
        timestamps: false,
        tableName: 'auth_keys',
        sequelize
      }
    )
  }

  static async getValidKey(address) {
    const authKey = await AuthKey.findOne({ where: { address } })
    if (!authKey) {
      return null
    }

    if (authKey.expires_at > new Date()) {
      return authKey
    }

    await authKey.destroy()

    return null
  }

}

module.exports = AuthKey
