const { validate, Joi } = require('express-validation')

const options = {
  keyByField: true
}

module.exports = {
  // GET /v1/token-unlocks
  validateDates: validate({
    query: Joi.object({
      uids: Joi.string().required()
    })
  }, options),
}
