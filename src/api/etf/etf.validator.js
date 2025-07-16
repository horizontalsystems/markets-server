const { validate, Joi } = require('../validations')

module.exports = {
  // GET /v1/etf/all
  validateEtfAll: validate({
    query: Joi.object({
      category: Joi.string().required().valid('btc', 'eth'),
    })
  }),

  // GET /v1/etf/chart
  validateEtfChart: validate({
    query: Joi.object({
      category: Joi.string().required().valid('btc', 'eth'),
    })
  }),

  // GET /v1/etf/treasuries
  validateEtfTreasuries: validate({
    query: Joi.object({
      type: Joi.string().valid(
        'public-companies',
        'private-companies',
        'etfs-and-exchanges',
        'governments'
      ),
    })
  }),
}
