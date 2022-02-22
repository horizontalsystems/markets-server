const { validate, Joi } = require('express-validation')

const options = {
  keyByField: true
}

module.exports = {
  // GET /v1/coins
  validateMarketCap: validate({
    params: Joi.object({
      uid: Joi.string().required()
    }),
    query: Joi.object({
      interval: Joi.string().valid('1d', '1w', '1m')
    })
  }, options),
}
