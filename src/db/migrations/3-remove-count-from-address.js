module.exports = {
  up(query) {
    return query.removeColumn('addresses', 'count')
  },

  down(query, Sequelize) {
    return query.addColumn('addresses', 'count', {
      type: Sequelize.DECIMAL,
      allowNull: false
    })
  }
}
