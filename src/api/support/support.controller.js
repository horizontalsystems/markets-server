const { handleError } = require('../middlewares')
const { createVipGroupLink } = require('./support-bot')

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
