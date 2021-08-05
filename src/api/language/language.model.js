const Sequelize = require('sequelize')

class Language extends Sequelize.Model {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        id: {
          type: DataTypes.STRING(5),
          allowNull: false,
          primaryKey: true
        },
        name: {
          type: DataTypes.STRING(100)
        }
      },
      {
        timestamps: false,
        tableName: 'languages',
        sequelize
      }
    )
  }

  static associate(models) {
    Language.hasMany(models.CategoryDescription)
  }

}

module.exports = Language
