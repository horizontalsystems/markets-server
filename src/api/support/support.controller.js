const telegram = require('../../providers/telegram')
const { handleError } = require('../middlewares')
const { telegramMessage } = require('../../utils')

exports.startChat = async ({ body }, res) => {
  try {
    if (!body.username) {
      return handleError(res, 403, 'Username is required')
    }

    await telegram.sendMessage(body.username, telegramMessage())
    res.send({})
  } catch (e) {
    console.log(e)
    handleError(res, 500, 'Internal server error')
  }
}

exports.createGroup = async ({ body }, res) => {
  try {
    if (!body.username) {
      return handleError(res, 403, 'Username is required')
    }

    const groupLink = await telegram.createGroup(body.username)
    res.json({ group_link: groupLink, })
  } catch (e) {
    console.log(e)
    handleError(res, 500, 'Internal server error')
  }
}
