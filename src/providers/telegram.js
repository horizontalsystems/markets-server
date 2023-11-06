const { configure, createClient } = require('tdl')
const { getTdjson } = require('prebuilt-tdlib')
const { telegramScamMessage } = require('../utils')

configure({ tdjson: getTdjson() })

class Telegram {
  async login() {
    const client = this.createClient()
    await client.login(() => ({
      getPhoneNumber: retry => (
        retry
          ? Promise.reject(Error('Invalid phone number'))
          : Promise.resolve(process.env.TELEGRAM_PHONE)
      ),
      getPassword: (passwordHint, retry) => (
        retry
          ? Promise.reject(Error('Invalid password'))
          : Promise.resolve(process.env.TELEGRAM_PASSWORD)
      )
    }))

    this.client = client
  }

  async monitor() {
    if (!this.client) {
      await this.login()
    }

    const chatId = process.env.TELEGRAM_CHANNEL_ID
    const onUpdate = msg => {
      if (msg._ === 'updateNewMessage') {
        if (String(msg.message.chat_id) === chatId && msg.message.content._ === 'messageChatAddMembers') {
          this.sendMessage(telegramScamMessage('Unstoppable Wallet | BE UNSTOPPABLE!'), null, msg.message.sender_id.user_id)
        }
      }
    }

    this.client.on('update', onUpdate)
  }

  async sendMessage(message, username, userId) {
    if (!this.client) {
      await this.login()
    }

    let id = userId
    if (!userId) {
      const result = await this.client.invoke({
        _: 'searchPublicChat',
        username,
      })
      id = result.id
    }

    const newChat = await this.client.invoke({
      _: 'createPrivateChat',
      user_id: id,
    })

    await this.client.invoke({
      _: 'sendMessage',
      chat_id: newChat.id,
      input_message_content: {
        _: 'inputMessageText',
        text: {
          _: 'formattedText',
          text: message
        }
      }
    })
  }

  createClient() {
    const client = createClient({
      apiId: process.env.TELEGRAM_API_ID,
      apiHash: process.env.TELEGRAM_API_HASH,
      phoneNumber: process.env.TELEGRAM_PHONE,
      skipOldUpdates: true
    })

    client.on('error', () => {
      this.client = null
    })

    client.on('destroy', () => {
      this.client = null
    })

    client.on('auth-not-needed', () => {
      this.client = null
    })

    return client
  }
}

module.exports = new Telegram()
