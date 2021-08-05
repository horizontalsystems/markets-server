const Sequelize = require('sequelize')

class CategoryDescription extends Sequelize.Model {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        content: {
          type: DataTypes.STRING(100)
        }
      },
      {
        timestamps: false,
        tableName: 'category_descriptions',
        sequelize
      }
    )
  }

  static associate(models) {
    CategoryDescription.belongsTo(models.Category)
    CategoryDescription.belongsTo(models.Language)
  }

}

module.exports = CategoryDescription
