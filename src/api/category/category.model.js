const { Model } = require('sequelize');

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

  static associate(models) {
    Category.hasMany(models.CategoryDescription, {
      as: 'descriptions'
    })

    Category.belongsToMany(models.Coin, { through: 'coin_categories' })
  }

}

module.exports = Category
