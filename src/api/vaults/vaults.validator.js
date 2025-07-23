const { validate, Joi } = require('express-validation')

const options = {
  keyByField: true
}

module.exports = {
  // GET /v1/vaults/:address
  validateVault: validate({
    params: Joi.object({
      address: Joi.string().required()
    }),
    query: Joi.object({
      range_interval: Joi.string().valid('1d', '1w', '2w', '1m', '3m'),
      currency: Joi.string()
    })
  }, options)

}
