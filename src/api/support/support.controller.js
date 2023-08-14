const telegram = require('../../providers/telegram')
const { handleError } = require('../middlewares')

exports.startChat = async ({ body }, res) => {
  try {
    if (!body.username) {
      return handleError(res, 403, 'Username is required')
    }

    await telegram.sendMessage(body.username)
    res.send({})
  } catch (e) {
    console.log(e)
    handleError(res, 500, 'Internal server error')
  }
}
