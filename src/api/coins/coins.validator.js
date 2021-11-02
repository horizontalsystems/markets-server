const { validate, Joi } = require('express-validation')

const options = {
  keyByField: true
}

module.exports = {
  // GET /v1/coins
  validateCoins: validate({
    query: Joi.object({
      uids: Joi.string(),
      fields: Joi.string(),
      limit: Joi.number()
        .min(1)
        .max(4000),
      currency: Joi.string()
    })
  }, options),

}
