const morgan = require('morgan')
const serializer = require('./stats.serializer')
const mongo = require('../../db/mongo')

const logs = mongo.collection('logs')

exports.popularCoins = async (req, res) => {
  const coins = await mongo.getStats('coin_stats')
  res.send(serializer.serializeCoins(coins))
}

exports.popularResources = async (req, res) => {
  const resources = await mongo.getStats('resource_stats')
  res.send(serializer.serializeResources(resources))
}

exports.stats = async (req, res) => {
  const { body, headers } = req

  const ip = headers['x-real-ip'] || morgan['remote-addr'](req, res)
  const appId = headers.app_id
  const appPlatform = headers.app_platform
  const appVersion = headers.app_version
  const records = []

  try {
    for (let i = 0; i < body.length; i += 1) {
      const item = body[i]

      if (ip) item.ip = ip
      if (appId) item.appId = appId
      if (appPlatform) item.appPlatform = appPlatform
      if (appVersion) item.appVersion = appVersion

      records.push(item)
    }
  } catch (e) {
    console.log(e)
    res.status(400)
    res.send({ message: 'Invalid request' })
    return
  }

  if (!records.length) {
    res.send({})
    return
  }

  try {
    logs.insertMany(records).catch(e => console.log(e))
  } catch (e) {
    console.log(e.message)
  }

  res.send({})
}

exports.logs = async () => {
  await mongo.storeStats({
    tag_name: 'market',
    tag_type: 'page_view',
  })

  await mongo.storeStats({
    tag_name: 'coin_page',
    tag_type: 'page_view',
    tag_parent: 'market',
  })

  await mongo.storeStats({
    tag_name: 'enable_coin',
    tag_type: 'click_add_button',
    tag_parent: 'coin_page',
    coin_uid: 'uniswap'
  })

  await mongo.storeStats({
    tag_name: 'indicators',
    tag_type: 'page_view',
    tag_parent: 'coin_page',
  })

  await mongo.storeStats({
    tag_name: 'indicators_settings',
    tag_parent: 'indicators',
    tag_data: {
      moving_averages: ['ma1'],
      oscillators: []
    },
  })

  await mongo.storeStats({
    tag_name: 'indicators',
    tag_type: 'page_view',
    tag_parent: 'coin_page',
    event_name: 'featured_product_click',
    event_data: {
      button_id: 'btn_featured_product',
      filter_type: 'price',
      filter_value: '$100 - $200'
    }
  })
}
