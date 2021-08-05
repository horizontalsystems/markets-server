const Language = require('./language.model')

exports.index = async (req, res) => {
  const languages = await Language.findAll()
  res.status(200).json(languages)
}
