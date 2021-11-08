const { validate, Joi } = require('express-validation')

const options = {
  keyByField: true
}

module.exports = {
  // GET /v1/reports
  validateReports: validate({
    query: Joi.object({
      coin_uid: Joi.string().required()
    })
  }, options)

}
