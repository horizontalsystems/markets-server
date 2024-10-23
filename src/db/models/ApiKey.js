const SequelizeModel = require('./SequelizeModel')

class ApiKey extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        key: {
          type: DataTypes.TEXT,
          allowNull: false,
          primaryKey: true
        },
        resource: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        index: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1,
        }
      },
      {
        sequelize,
        timestamps: false,
        tableName: 'api_keys',
        indexes: [
          { fields: ['resource'] }
        ]
      }
    )
  }

  static getRandomList() {
    return ApiKey.query(`
      WITH records AS (
        SELECT *, ROW_NUMBER() OVER (PARTITION BY resource ORDER BY random()) AS rn FROM api_keys
      )
      SELECT key, resource, index
        FROM records WHERE rn <= 3
       ORDER BY resource, index
    `)
  }

  static getRandomByResource(resource) {
    return ApiKey.query(`
      SELECT key, resource, index
        FROM api_keys
       WHERE resource = :resource ORDER BY random() LIMIT 3
    `, { resource })
  }

}

module.exports = ApiKey
