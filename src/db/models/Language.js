const Sequelize = require('sequelize')

class Language extends Sequelize.Model {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        code: {
          type: DataTypes.STRING(5),
          allowNull: false,
          unique: true
        },
        name: {
          type: DataTypes.STRING(100),
          allowNull: false
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
