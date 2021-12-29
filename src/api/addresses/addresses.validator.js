const { validate, Joi } = require('express-validation')

const options = {
  keyByField: true
}

module.exports = {
  // GET /v1/addresses
  validateAddresses: validate({
    query: Joi.object({
      coin_uid: Joi.string().required(),
      interval: Joi.string().valid('1d', '7d', '30d'),
      currency: Joi.string()
    })
  }, options),

  // GET /v1/addresses/holders
  validateHolders: validate({
    query: Joi.object({
      coin_uid: Joi.string().required(),
      platform: Joi.string().valid('erc20', 'ethereum'),
      limit: Joi.number().min(1).max(20),
    })
  }, options),

}
