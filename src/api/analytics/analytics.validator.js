const { validate, Joi } = require('../validations')

module.exports = {
  // GET /v1/analytics/:uid
  validate: validate({
    params: Joi.object({
      uid: Joi.string().required()
    }),
    query: Joi.object({})
  }),

}
