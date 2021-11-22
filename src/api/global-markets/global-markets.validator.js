const { validate, Joi } = require('express-validation')

const options = {
  keyByField: true
}

module.exports = {
  // GET /v1/global-markets
  validateGlobalMarkets: validate({
    query: Joi.object({
      interval: Joi.string().valid('1d', '7d', '30d'),
      currency: Joi.string()
    })
  }, options),

  // GET /v1/global-markets/tvls
  validateGlobalTvls: validate({
    query: Joi.object({
      chain: Joi.string(),
      interval: Joi.string().valid('1d', '7d', '30d'),
      currency: Joi.string()
    })
  }, options)

}
