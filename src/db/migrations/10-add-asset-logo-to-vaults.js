module.exports = {
  async up(query, Sequelize) {
    await query.addColumn('vaults', 'asset_logo', {
      type: Sequelize.STRING,
    })
  },

  async down(query) {
    await query.removeColumn('vaults', 'asset_logo')
  }
}
