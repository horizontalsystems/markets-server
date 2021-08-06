const { Model } = require('sequelize');

class Category extends Model {

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
        name: {
          singular: 'category',
          plural: 'categories',
        },
        sequelize
      }
    )
  }

  static associate(models) {
    Category.hasMany(models.CategoryDescription, {
      as: 'descriptions'
    })

    Category.belongsToMany(models.Coin, { through: 'coin_categories' });
  }

}

module.exports = Category
