const SequelizeModel = require('./SequelizeModel')

class ContractIssue extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        id: {
          type: DataTypes.BIGINT,
          autoIncrement: true,
          primaryKey: true
        },
        issues: DataTypes.JSONB,
      },
      {
        sequelize,
        tableName: 'contract_issues',
        indexes: [{
          unique: true,
          fields: ['platform_id']
        }]
      }
    )
  }

  static associate(models) {
    ContractIssue.belongsTo(models.Platform, {
      foreignKey: 'platform_id'
    })
  }

  static getIssues(uid) {
    const query = (`
      SELECT
        i.*,
        p.chain_uid as chain
      FROM coins c, platforms p, contract_issues i
      WHERE c.uid = :uid
        AND p.coin_id = c.id
        AND p.id = i.platform_id
    `)

    return ContractIssue.query(query, { uid })
  }

}

module.exports = ContractIssue
