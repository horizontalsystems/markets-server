const { configure, createClient } = require('tdl')
const { getTdjson } = require('prebuilt-tdlib')
const { telegramScamMessage, sleep } = require('../utils')
const _ = require('lodash')

configure({ tdjson: getTdjson() })

class Telegram {
  async login() {
    const client = this.createClient()
    await client.login(() => ({
      getPhoneNumber: retry => (
        retry
          ? Promise.reject(Error('Invalid phone number'))
          : Promise.resolve(process.env.TELEGRAM_PHONE)
      )
    }))

    this.client = client
  }

  async getMessages() {
    if (!this.client) {
      await this.login()
    }

    // const me = await this.client.invoke({ _: 'getMe' })
    // console.log('My user:', me)

    const chats = await this.client.invoke({
      _: 'getChats',
      chat_list: { _: 'chatListMain' },
      limit: 10
    })

    console.log(chats)
    return this.client.close()

    const data = await this.client
      .invoke({
        _: 'getChatHistory',
        chat_id: 7199462144,
        // from_message_id: 0,
        // from_message_id: 15413018624,
        from_message_id: 0,
        limit: 1000
      })
      .catch(console.error)

    console.log('total', data)
  }

  async getChannelMessages() {
    if (!this.client) {
      await this.login()
    }

    const messages = []

    let messageId = 0
    let running = true
    while (running) {
      const data = await this.client
        .invoke({
          _: 'getChatHistory',
          chat_id: -1001534592031,
          from_message_id: messageId,
          // from_message_id: 15413018624,
          // from_message_id: 15308161024,
          limit: 1000
        })

      let date = null
      for (let i = 0; i < data.messages.length; i += 1) {
        const message = data.messages[i]

        messages.push({ timestamp: message.date, text: _.get(message, 'content.text.text') })
        messageId = message.id

        date = new Date(message.date * 1000)
        if (message.date < 1719187200) {
          running = false
        }
      }
      console.log(date)

      await sleep(1000)
    }

    console.log(JSON.stringify(messages))
  }

  async monitor() {
    if (!this.client) {
      await this.login()
    }

    const chatId = process.env.TELEGRAM_CHANNEL_ID
    const onUpdate = msg => {
      console.log(JSON.stringify(msg, null, 2))
      // if (msg._ === 'updateNewMessage') {
      //   if (String(msg.message.chat_id) === chatId && msg.message.content._ === 'messageChatAddMembers') {
      //     this.sendMessage(telegramScamMessage('Unstoppable Wallet | BE UNSTOPPABLE!'), null, msg.message.sender_id.user_id)
      //     console.log('Sent message to user', msg.message.sender_id.user_id)
      //   }
      // }
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
