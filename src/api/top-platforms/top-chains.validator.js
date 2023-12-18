const { validate, Joi } = require('../validations')

module.exports = {
  validateChart: validate({
    params: Joi.object({
      chain: Joi.string().required()
    }),
    query: Joi.object({
      from_timestamp: Joi.number().required(),
      interval: Joi.string().valid('30m', '1h', '4h', '8h', '1d', '1w').required(),
      currency: Joi.string()
    })
  }),
}
