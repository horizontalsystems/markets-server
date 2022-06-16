module.exports = {
  up(query, Sequelize) {
    return query.addColumn('chains', 'url', {
      type: Sequelize.STRING
    })
  },

  down(query) {
    return query.removeColumn('chains', 'url')
  }
}
