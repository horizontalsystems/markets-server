const { validate, Joi } = require('express-validation')

const options = {
  keyByField: true
}

module.exports = {
  // GET /v1/global-markets
  validateGlobalMarkets: validate({
    query: Joi.object({
      // @deprecated intervals 7d,30d
      interval: Joi.string().valid('1d', '1w', '2w', '1m', '3m', '6m', '1y', '7d', '30d'),
      currency: Joi.string()
    })
  }, options),

  // GET /v1/global-markets/tvls
  validateGlobalTvls: validate({
    query: Joi.object({
      chain: Joi.string(),
      // @deprecated intervals 7d,30d
      interval: Joi.string().valid('1d', '1w', '2w', '1m', '3m', '6m', '1y', '7d', '30d'),
      currency: Joi.string()
    })
  }, options)

}
