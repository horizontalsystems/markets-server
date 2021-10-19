const SequelizeModel = require('./SequelizeModel')

class Category extends SequelizeModel {

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
    Category.belongsToMany(models.Coin, { through: models.CoinCategories })
  }

  static async getCoins(uid) {
    const query = (`
      SELECT C.* 
      FROM categories cat, coin_categories M, coins C
      WHERE cat.uid = :uid
        AND M.category_id = cat.id
        AND M.coin_id = C.id
    `)

    return Category.query(query, { uid })
  }

}

module.exports = Category
