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
        .max(1500),
      page: Joi.number()
        .min(1),
      defi: Joi.boolean()
        .sensitive(true),
      order_by_rank: Joi.boolean()
        .sensitive(true),
      currency: Joi.string()
    })
  }, options),

  // GET /v1/coins/:uid
  validateShow: validate({
    query: Joi.object({
      language: Joi.string().valid('en', 'de', 'es', 'fa', 'fr', 'ko', 'ru', 'tr', 'zh'),
      currency: Joi.string()
    })
  }, options),

  validateChart: validate({
    params: Joi.object({
      uid: Joi.string().required()
    }),
    query: Joi.object({
      interval: Joi.string().valid('1d', '1w', '2w', '1m', '3m', '6m', '1y'),
      currency: Joi.string()
    })
  }, options),
}
