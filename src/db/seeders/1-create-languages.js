module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('languages', [
      { id: 1, code: 'en', name: 'English' },
      { id: 2, code: 'ru', name: 'Russian' },
      { id: 3, code: 'de', name: 'German' },
    ], {})
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('languages', null, {})
  }
}
