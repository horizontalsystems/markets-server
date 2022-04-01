module.exports = {
  up(query, Sequelize) {
    return query.addColumn('coins', 'stats', {
      type: Sequelize.JSONB,
      defaultValue: {}
    })
  },

  down(query) {
    return query.removeColumn('coins', 'stats')
  }
}
