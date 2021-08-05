const Sequelize = require('sequelize')

class Category extends Sequelize.Model {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        id: {
          type: DataTypes.STRING(50),
          allowNull: false,
          primaryKey: true
        },
        name: {
          type: DataTypes.STRING(100)
        }
      },
      {
        timestamps: false,
        tableName: 'categories',
        sequelize
      }
    )
  }

  static associate(models) {
    Category.hasMany(models.CategoryDescription, {
      as: 'descriptions'
    })
  }

}

module.exports = Category
