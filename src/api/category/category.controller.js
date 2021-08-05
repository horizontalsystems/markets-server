const Category = require('./category.model')
const CategoryDescription = require('../category-description/category-description.model')

exports.index = async (req, res) => {
  const categories = await Category.findAll({
    include: {
      model: CategoryDescription,
      as: 'descriptions',
      attributes: ['language_id', 'content']
    }
  })

  res.status(200).json(categories)
}
