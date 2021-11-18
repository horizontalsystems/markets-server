module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('currencies', [
      { code: 'usd', name: 'US Dollar' },
      { code: 'eur', name: 'Euro' },
      { code: 'gbp', name: 'Australian Dollar' },
      { code: 'jpy', name: 'Japan Yen' },
      { code: 'aud', name: 'Australian Dollar' },
      { code: 'cad', name: 'Canadian Dollar' },
      { code: 'sgd', name: 'Singapore Dollar' },
      { code: 'brl', name: 'Brazilian Real' },
      { code: 'chf', name: 'Swiss Franc' },
      { code: 'cny', name: 'Chinese Yuan' },
      { code: 'hkd', name: 'Hong Kong Dollar' },
      { code: 'ils', name: 'Israeli New Sheke' },
      { code: 'rub', name: 'Russian Ruble' },
      { code: 'try', name: 'Turkish Lira' },
    ], {})
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('currencies', null, {})
  }
}
