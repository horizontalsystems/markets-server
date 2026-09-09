const SequelizeModel = require('./SequelizeModel')

class AppState extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        version: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true
        },
        swap_enabled: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true
        }
      },
      {
        timestamps: false,
        tableName: 'app_states',
        sequelize
      }
    )
  }

  static async isSwapEnabled(version) {
    if (!version) {
      return true
    }

    const state = await AppState.findOne({
      attributes: ['swap_enabled'],
      where: { version: String(version) }
    })

    return state ? state.swap_enabled : true
  }
}

module.exports = AppState
