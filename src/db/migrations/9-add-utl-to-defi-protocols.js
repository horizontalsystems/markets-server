module.exports = {
  async up(query, Sequelize) {
    await query.addColumn('defi_protocols', 'url', {
      type: Sequelize.STRING,
    })
  },

  async down(query) {
    await query.removeColumn('defi_protocols', 'url')
  }
}
