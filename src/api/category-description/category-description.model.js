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
        sequelize,
        indexes: [
          { unique: true, fields: ['category_id', 'language_id'] }
        ]
      }
    )
  }

  static associate(models) {
    CategoryDescription.belongsTo(models.Category)
    CategoryDescription.belongsTo(models.Language)
  }

}

module.exports = CategoryDescription
