const SequelizeModel = require('./SequelizeModel')

class Report extends SequelizeModel {

  static init(sequelize, DataTypes) {
    return super.init(
      {
        author: {
          type: DataTypes.STRING,
          allowNull: false
        },
        title: {
          type: DataTypes.STRING,
          allowNull: false
        },
        body: {
          type: DataTypes.TEXT,
          allowNull: false
        },
        date: {
          type: DataTypes.DATEONLY,
          allowNull: false
        },
        url: {
          type: DataTypes.TEXT,
          allowNull: false
        }
      },
      {
        timestamps: false,
        tableName: 'reports',
        sequelize
      }
    )
  }

  static associate(models) {
    Report.belongsTo(models.Coin, {
      foreignKey: 'coin_id'
    })
  }

  static getList(uid) {
    const query = `
      SELECT R.*
      FROM reports R
      JOIN coins C on C.id = R.coin_id AND C.uid = :uid
    `

    return Report.query(query, { uid })
  }
}

module.exports = Report
