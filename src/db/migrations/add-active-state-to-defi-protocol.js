module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('defi_protocols', 'tvl_rank')
    await queryInterface.addColumn('defi_protocols', 'is_active', {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('defi_protocols', 'tvl_rank', Sequelize.INTEGER)
    await queryInterface.removeColumn('defi_protocols', 'is_active')
  }
}
