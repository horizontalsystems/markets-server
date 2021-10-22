module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('languages', [
      { id: 1, code: 'en', name: 'English' },
      { id: 2, code: 'de', name: 'German' },
      { id: 3, code: 'ru', name: 'Russian' },
      { id: 4, code: 'es', name: 'Spanish' },
      { id: 5, code: 'fa', name: 'Persian' },
      { id: 6, code: 'fr', name: 'French' },
      { id: 7, code: 'ko', name: 'Korean' },
      { id: 8, code: 'tr', name: 'Turkish' },
      { id: 9, code: 'zh', name: 'Chinese' }
    ], {})
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('languages', null, {})
  }
}
