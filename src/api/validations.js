const { validate, Joi } = require('express-validation')

function validator(schema, options = { keyByField: true }) {
  return validate(schema, options)
}

module.exports = { validate: validator, Joi }
