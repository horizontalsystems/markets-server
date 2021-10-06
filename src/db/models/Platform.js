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

  static async findByCoinUID(uid) {
    const [platform] = await Platform.query(`
      SELECT platforms.* FROM platforms
      INNER JOIN coins
      ON coins.id = platforms.coin_id AND coins.uid = '${uid}'
    `)

    return platform
  }

  static findEthErc20() {
    return Platform.query(`
      SELECT * 
      FROM platforms 
      WHERE type IN ('ethereum', 'erc20')
        AND decimals IS NOT NULL
    `)
  }

  static findErc20() {
    return Platform.query(`
      SELECT * 
      FROM platforms 
      WHERE type = 'erc20'
        AND decimals IS NOT NULL
        AND address IS NOT NULL
    `)
  }
}

module.exports = Platform
