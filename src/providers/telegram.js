const input = require('input')
const { Api, TelegramClient } = require('telegram')
const { StringSession } = require('telegram/sessions')
const { Raw } = require('telegram/events')
const { telegramScamMessage } = require('../utils')

class Telegram {
  constructor() {
    const apiId = parseInt(process.env.TELEGRAM_API_ID, 10)
    const apiHash = process.env.TELEGRAM_API_HASH
    const stringSession = new StringSession(process.env.TELEGRAM_SESSION)

    this.client = new TelegramClient(stringSession, apiId, apiHash, {
      connectionRetries: 5,
    })
  }

  async start() {
    await this.client.start({
      phoneNumber: async () => process.env.TELEGRAM_PHONE, // input.text('Please enter your number: '),
      password: async () => input.text('Please enter your password: '),
      phoneCode: async () => input.text('Please enter the code you received: '),
      onError: console.error,
    })

    console.log('Session string:')
    console.log(this.client.session.save())
  }

  connect() {
    return this.client.connect()
  }

  async createGroup() {
    try {
      const users = (process.env.TELEGRAM_SUPPORT_USERS || '')
        .split(',')
        .filter(a => a)

      const telegram = this.client
      const result = await telegram.invoke(
        new Api.messages.CreateChat({
          users,
          title: 'Premium support Group',
        })
      )

      const chatId = result.updates.chats[0].id.value;
      const inviteLink = await telegram.invoke(
        new Api.messages.ExportChatInvite({
          peer: `-${chatId.toString()}`,
          // expireDate: 10,
          // usageLimit: 10
        })
      )

      return {
        id: chatId,
        link: inviteLink.link
      }
    } catch (e) {
      console.log(e)
      return null
    }
  }

  monitor() {
    console.log('Monitoring spam group and sending warning message to new users')

    const telegram = this.client
    const handler = async (event) => {
      if (event && event.className === 'UpdateNewMessage') {
        const { message } = event
        if (!message || !message.action) return

        if (message.action.className === 'MessageActionChatJoinedByLink' || message.action.className === 'MessageActionChatJoinedByRequest') {
          const userId = message.fromId.userId.toString()
          await telegram.sendMessage(userId, { message: telegramScamMessage('Unstoppable Wallet | BE UNSTOPPABLE!') })
          console.log('Warning message sent to', userId)
        }
      }
    }

    telegram.addEventHandler(handler, new Raw({
      chats: ['@unstoppablewallets']
    }))
  }

  sendMessage(username, message) {
    return this.client.sendMessage(username, { message })
  }
}

module.exports = new Telegram()
