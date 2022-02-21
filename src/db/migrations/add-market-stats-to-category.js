module.exports = {
  async up(query, Sequelize) {
    const transaction = await query.sequelize.transaction()

    try {
      await query.addColumn('categories', 'market_cap', {
        type: Sequelize.JSONB,
        defaultValue: {}
      })

      await query.addColumn('categories', 'enabled', {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      })

      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  },

  async down(query) {
    const transaction = await query.sequelize.transaction()
    try {
      await query.removeColumn('categories', 'market_cap')
      await query.removeColumn('categories', 'enabled')
      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  }
}
