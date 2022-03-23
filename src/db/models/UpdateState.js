const SequelizeModel = require('./SequelizeModel')

class UpdateState extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        name: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true
        },
        date: {
          type: DataTypes.DATE,
          allowNull: false
        }
      },
      {
        timestamps: false,
        tableName: 'update_states',
        sequelize
      }
    )
  }

  static getAll() {
    return UpdateState.query('SELECT name, EXTRACT(epoch from date)::int as timestamp from update_states')
  }

  static reset(name) {
    return UpdateState.upsert({ name, date: new Date() })
  }
}

module.exports = UpdateState
