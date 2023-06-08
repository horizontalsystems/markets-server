const { validate, Joi } = require('express-validation')

const options = {
  keyByField: true
}

module.exports = {
  // GET /v1/auth/get-sign-message
  validateSignMessage: validate({
    query: Joi.object({
      address: Joi.string().required()
    })
  }, options),

  // POST /v1/auth/authenticate
  validateAuthenticate: validate({
    body: Joi.object({
      signature: Joi.string().required(),
      address: Joi.string().required()
    })
  }, options)

}
