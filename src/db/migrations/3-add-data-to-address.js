module.exports = {
  async up(query, Sequelize) {
    const transaction = await query.sequelize.transaction()

    try {
      await query.removeColumn('addresses', 'count')
      await query.addColumn('addresses', 'data', {
        type: Sequelize.JSONB,
        defaultValue: {}
      })

      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  },

  async down(query, Sequelize) {
    const transaction = await query.sequelize.transaction()
    try {
      await query.removeColumn('addresses', 'data')
      await query.addColumn('addresses', 'count', {
        type: Sequelize.DECIMAL,
        allowNull: false
      })
      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  }
}
