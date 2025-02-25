const telegram = require('../../providers/telegram')
const { handleError } = require('../middlewares')
const { telegramMessage } = require('../../utils')
const { createVipGroupLink } = require('./telegram-vip-support-bot')

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
    if (!body.subscription_id) {
      return handleError(res, 403, 'Subscription_id is required')
    }

    const groupLink = await createVipGroupLink()
    res.json({ group_link: groupLink })
  } catch (e) {
    console.log(e)
    handleError(res, 500, 'Internal server error')
  }
}
