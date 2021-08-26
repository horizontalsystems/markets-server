module.exports = {

  serialize: (categories) => {
    return categories.map(category => ({
      uid: category.uid,
      name: category.name,
      descriptions: category.descriptions.map(description => ({
        language: description.Language.code,
        content: description.content
      })),
    }))
  }

}
