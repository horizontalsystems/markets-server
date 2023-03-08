const { validate, Joi } = require('../validations')

module.exports = {
  // GET /v1/analytics/:uid
  validateRanks: validate({
    query: Joi.object({
      type: Joi.string()
        .required()
        .valid(
          'cex_volume',
          'dex_volume',
          'dex_liquidity',
          'tx_count',
          'revenue',
          'address'
        )
    })
  }),

}
