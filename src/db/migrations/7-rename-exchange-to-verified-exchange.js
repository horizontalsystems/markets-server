module.exports = {
  async up(query) {
    await query.renameTable('exchanges', 'verified_exchanges')
  },

  async down(query) {
    await query.renameTable('verified_exchanges', 'exchanges')
  }
}
