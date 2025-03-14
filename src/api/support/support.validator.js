const { validate, Joi } = require('../validations')

module.exports = {

  // POST /v1/support/create-group
  validateCreateGroup: validate({
    body: Joi.object({
      platform: Joi.string().required(),
      subscription_id: Joi.string().required(),
      subscription_deadline: Joi.number()
    })
  }),

}
