const TelegramBot = require('node-telegram-bot-api')

const bot = new TelegramBot(process.env.TELEGRAM_SUPPORT_BOT, { polling: true })
const chatId = process.env.TELEGRAM_SUPPORT_CHAT

exports.createVipGroupLink = async () => {
  try {
    const res = await bot.createChatInviteLink(chatId, {
      expire_date: Math.floor(Date.now() / 1000) + 3600, // Expires in 1 hour
      member_limit: 1 // Can be used only once
    })

    return res.invite_link
  } catch (err) {
    console.error('Error creating invite link:', err)
    return null
  }
}
