const SequelizeModel = require('./SequelizeModel')

class Platform extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        type: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        symbol: DataTypes.STRING(100),
        address: DataTypes.STRING(100),
        decimals: DataTypes.INTEGER
      },
      {
        timestamps: false,
        tableName: 'platforms',
        sequelize,
        indexes: [{
          unique: true,
          fields: ['coin_id', 'type']
        }]
      }
    )
  }

  static associate(models) {
    Platform.belongsTo(models.Coin, {
      foreignKey: 'coin_id'
    })
  }

  static async findByCoinUID(uid, type = 'erc20') {
    const query = `
      SELECT platforms.*
      FROM platforms
      INNER JOIN coins
         ON coins.id = platforms.coin_id
        AND coins.uid = :uid
      WHERE platforms.type = :type
    `

    const [platform] = await Platform.query(query, {
      uid,
      type
    })

    return platform
  }

  static getByTypes(type, withDecimal) {
    const where = {
      type,
      address: Platform.literal('address IS NOT NULL')
    }

    if (withDecimal) {
      where.decimals = Platform.literal('decimals IS NOT NULL')
    }

    return Platform.findAll({ where })
  }

}

module.exports = Platform
