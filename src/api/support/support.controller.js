const telegram = require('../../providers/telegram')
const Subscription = require('../../db/models/Subscription')
const { handleError } = require('../middlewares')

exports.startChat = async ({ body, address }, res) => {
  try {
    const subscription = await Subscription.findOne({
      where: { address }
    })

    if (!subscription) {
      return handleError(res, 403, 'Subscription is required')
    }

    if (subscription.chat_started) {
      // return handleError(res, 403, 'Already sent a message')
    }

    await telegram.sendMessage(body.username)
    await subscription.update({ chat_started: true })
    res.send({})
  } catch (e) {
    console.log(e)
    handleError(res, 500, 'Internal server error')
  }
}
