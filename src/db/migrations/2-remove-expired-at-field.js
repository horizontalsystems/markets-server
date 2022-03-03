module.exports = {
  async up(query) {
    const transaction = await query.sequelize.transaction()

    try {
      await query.removeColumn('addresses', 'expires_at')
      await query.removeColumn('currency_rates', 'expires_at')

      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  },

  async down(query, Sequelize) {
    const transaction = await query.sequelize.transaction()
    try {
      await query.addColumn('addresses', 'expires_at', {
        type: Sequelize.DATE
      })
      await query.addColumn('currency_rates', 'expires_at', {
        type: Sequelize.DATE
      })

      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  }
}
