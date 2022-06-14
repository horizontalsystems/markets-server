const SequelizeModel = require('./SequelizeModel')

class Block extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        chain: DataTypes.STRING,
        hash: DataTypes.STRING,
        number: {
          type: DataTypes.INTEGER,
          allowNull: false
        }
      },
      {
        sequelize,
        tableName: 'blocks',
        indexes: [{
          unique: true,
          fields: ['chain', 'number']
        }]
      }
    )
  }

  static async exists() {
    return !!await Block.findOne()
  }

  static getBlockHashes(chain, number) {
    return Block.findAll({
      where: {
        chain,
        number
      }
    })
  }

}

module.exports = Block
