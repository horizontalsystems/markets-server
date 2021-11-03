const { validate, Joi } = require('express-validation')

const options = {
  keyByField: true
}

module.exports = {
  // GET /v1/transactions
  validateTransactions: validate({
    query: Joi.object({
      coin_uid: Joi.string().required(),
      interval: Joi.string().valid('1d', '7d', '30d')
    })
  }, options),
}
