const { Model } = require('sequelize');
const CategoryDescription = require('../category-description/category-description.model');
const Language = require('../language/language.model');

class Category extends Model {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        uid: {
          type: DataTypes.STRING(50),
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
        tableName: 'categories',
        sequelize
      }
    )
  }

  static all() {
    return Category.findAll({
      include: {
        model: CategoryDescription,
        as: 'descriptions',
        include: { model: Language }
      }
    })
  }

  static associate(models) {
    Category.hasMany(models.CategoryDescription, {
      as: 'descriptions'
    })

    Category.belongsToMany(models.Coin, { through: 'coin_categories' })
  }

}

module.exports = Category
