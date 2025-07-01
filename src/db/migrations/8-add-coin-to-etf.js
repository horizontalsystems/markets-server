module.exports = {
  async up(query, Sequelize) {
    await query.addColumn('etf', 'category', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'btc'
    })

    await query.addColumn('etf_total_inflow', 'category', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'btc'
    })

    await query.removeIndex('etf_total_inflow', 'etf_total_inflow_date_key')
    await query.addIndex('etf_total_inflow', {
      fields: ['date', 'category'],
      type: 'unique',
      name: 'etf_total_inflow_date_category'
    })
  },

  async down(query) {
    await query.removeColumn('etf', 'category')
    await query.removeColumn('etf_total_inflow', 'category')

    await query.removeIndex('etf_total_inflow', 'etf_total_inflow_date_category')
    await query.addIndex('etf_total_inflow', 'etf_total_inflow_date_key')
  }
}
