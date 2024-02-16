const SequelizeModel = require('./SequelizeModel')

class CoinAudit extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        id: {
          type: DataTypes.BIGINT,
          autoIncrement: true,
          primaryKey: true
        },
        audits: DataTypes.JSONB,
      },
      {
        sequelize,
        tableName: 'coin_audits',
        indexes: [{
          unique: true,
          fields: ['coin_id']
        }]
      }
    )
  }

  static associate(models) {
    CoinAudit.belongsTo(models.Coin, {
      foreignKey: 'coin_id'
    })
  }

  static async getAuditsByCoin(id) {
    const [data] = await CoinAudit.findAll({
      where: {
        coin_id: id
      },
      raw: true
    })

    if (!data || !data.audits || !data.audits.length) {
      return []
    }

    return data.audits
  }

}

module.exports = CoinAudit
