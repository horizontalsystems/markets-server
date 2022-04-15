module.exports = {
  up(query, Sequelize) {
    return query.addColumn('addresses', 'data', {
      type: Sequelize.JSONB
    })
  },

  down(query) {
    return query.removeColumn('addresses', 'data')
  }
}
