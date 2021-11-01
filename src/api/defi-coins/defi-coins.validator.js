const { validate, Joi } = require('express-validation')

const options = {
  keyByField: true
}

module.exports = {
  // GET /v1/defi-coins
  validateCoins: validate({
    query: Joi.object({
      currency: Joi.string()
    })
  }, options)
}
