module.exports = {
  up(query, Sequelize) {
    return query.addColumn('platforms', 'chain_uid', {
      type: Sequelize.STRING(50),
      allowNull: false,
      references: {
        model: 'chains',
        key: 'uid'
      }
    })
  },

  down(query) {
    return query.removeColumn('platforms', 'chain_uid')
  }
}
