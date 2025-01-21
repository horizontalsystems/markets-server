const { validate, Joi } = require('../validations')

module.exports = {

  // POST /v1/support/start-chat
  validateChat: validate({
    body: Joi.object({
      username: Joi.string().required()
    })
  }),

  // POST /v1/support/create-group
  validateCreateGroup: validate({
    body: Joi.object({
      username: Joi.string().required()
    })
  }),

}
