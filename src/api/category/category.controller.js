const Category = require('./category.model')
const serializer = require('./category.serializer')

exports.index = async (req, res) => {
  const categories = await Category.all()
  res.status(200).json(serializer.serialize(categories))
}
