module.exports = {
  up(query, Sequelize) {
    return query.addColumn('platforms', 'circulating_supply', {
      type: Sequelize.DECIMAL
    })
  },

  down(query) {
    return query.removeColumn('platforms', 'circulating_supply')
  }
}
