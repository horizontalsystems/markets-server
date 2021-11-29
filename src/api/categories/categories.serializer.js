module.exports = {

  serialize: categories => {
    return categories.map(category => ({
      uid: category.uid,
      name: category.name,
      order: category.order,
      description: category.description || {},
    }))
  }

}
