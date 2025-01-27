const telegram = require('../../providers/telegram')
const VipSupportGroup = require('../../db/models/VipSupportGroup')
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
    if (!body.subscription_id || !body.subscription_deadline) {
      return handleError(res, 403, 'Subscription_id and subscription_deadline are required')
    }

    const oldGroup = await VipSupportGroup.findOne({
      where: {
        subscription_id: body.subscription_id
      }
    })

    if (oldGroup) {
      return res.json({ group_link: oldGroup.group_link, })
    }

    const group = await telegram.createGroup(body.username)
    const newGroup = await VipSupportGroup.create({
      subscription_id: body.subscription_id,
      subscription_deadline: body.subscription_deadline,
      group_id: group.id,
      group_link: group.link,
    })

    res.json({ group_link: group.link, })
  } catch (e) {
    console.log(e)
    handleError(res, 500, 'Internal server error')
  }
}
