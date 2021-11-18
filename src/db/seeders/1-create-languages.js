module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('languages', [
      { code: 'en', name: 'English' },
      { code: 'de', name: 'German' },
      { code: 'ru', name: 'Russian' },
      { code: 'es', name: 'Spanish' },
      { code: 'fa', name: 'Persian' },
      { code: 'fr', name: 'French' },
      { code: 'ko', name: 'Korean' },
      { code: 'tr', name: 'Turkish' },
      { code: 'zh', name: 'Chinese' }
    ], {})
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('languages', null, {})
  }
}
