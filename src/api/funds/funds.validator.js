const { validate, Joi } = require('express-validation')

const options = {
  keyByField: true
}

module.exports = {
  // GET /v1/funds/treasuries
  validateTreasuries: validate({
    query: Joi.object({
      coin_uid: Joi.string().required(),
      currency: Joi.string()
    })
  }, options),

  // GET /v1/funds/investments
  validateInvestments: validate({
    query: Joi.object({
      coin_uid: Joi.string().required()
    })
  }, options),

}
