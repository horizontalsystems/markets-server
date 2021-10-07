module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('currencies', [
      { id: 1, code: 'usd', name: 'US Dollar' },
      { id: 2, code: 'eur', name: 'Euro' },
      { id: 3, code: 'gbp', name: 'Australian Dollar' },
      { id: 4, code: 'jpy', name: 'Japan Yen' },
      { id: 5, code: 'aud', name: 'Australian Dollar' },
      { id: 6, code: 'cad', name: 'Canadian Dollar' },
      { id: 7, code: 'sgd', name: 'Singapore Dollar' },
      { id: 8, code: 'brl', name: 'Brazilian Real' },
      { id: 9, code: 'chf', name: 'Swiss Franc' },
      { id: 10, code: 'cny', name: 'Chinese Yuan' },
      { id: 11, code: 'hkd', name: 'Hong Kong Dollar' },
      { id: 12, code: 'ils', name: 'Israeli New Sheke' },
      { id: 13, code: 'rub', name: 'Russian Ruble' },
      { id: 14, code: 'try', name: 'Turkish Lira' },
    ], {})
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('currencies', null, {})
  }
}
