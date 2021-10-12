module.exports = {

  serialize: (categories) => {
    return categories.map(category => ({
      uid: category.uid,
      name: category.name,
      description: category.description || {},
    }))
  }

}
