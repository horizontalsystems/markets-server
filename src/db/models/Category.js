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
        },
        description: DataTypes.JSONB,
        //  {
        //    en: 'Description text',
        //    ru: 'Description text'
        //  }
      },
      {
        timestamps: false,
        tableName: 'categories',
        sequelize
      }
    )
  }

  static associate(models) {
    Category.belongsToMany(models.Coin, { through: 'coin_categories' })
  }

}

module.exports = Category
