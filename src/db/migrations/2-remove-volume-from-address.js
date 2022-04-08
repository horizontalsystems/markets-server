module.exports = {
  up(query) {
    return query.removeColumn('addresses', 'volume')
  },

  down(query, Sequelize) {
    return query.addColumn('addresses', 'volume', {
      type: Sequelize.DECIMAL,
      allowNull: false
    })
  }
}
