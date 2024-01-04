const { validate, Joi } = require('../validations')

module.exports = {
  // GET /v1/exchanges/top-pairs
  validateTopPairs: validate({
    query: Joi.object({
      limit: Joi.number()
        .min(100)
        .max(1000),
      page: Joi.number()
        .min(1),
      currency: Joi.string()
    })
  }),
}
