const Language = require('../../db/models/Language')

exports.index = async (req, res) => {
  const languages = await Language.findAll()
  res.status(200).json(languages)
}
