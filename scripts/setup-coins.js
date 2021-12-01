require('dotenv/config')

const TurndownService = require('turndown')
const { sleep } = require('../src/utils')
const coingecko = require('../src/providers/coingecko')
const sequelize = require('../src/db/sequelize')
const Coin = require('../src/db/models/Coin')
const Platform = require('../src/db/models/Platform')
const Language = require('../src/db/models/Language')
const binanceDex = require('../src/providers/binance-dex')
const web3Provider = require('../src/providers/web3')
const coinsJoin = require('../src/db/seeders/coins.json')

const coinsCache = coinsJoin.reduce((result, coin) => ({ ...result, [coin.uid]: coin }), {})
const turndownService = new TurndownService()
  .addRule('remove_links', {
    filter: node => node.nodeName === 'A' && node.getAttribute('href'),
    replacement: content => content
  })

async function syncCoins(coinIds) {
  console.log(`Fetching coins ${coinIds.length}`)
  const coinIdsPerPage = coinIds.splice(0, 420)

  const coins = await coingecko.getMarkets(coinIdsPerPage)
  const allRecords = await Coin.bulkCreate(coins, { ignoreDuplicates: true })
  const newRecords = allRecords.filter(record => record.id)

  if (coins.length >= (coinIdsPerPage.length + coinIds.length) || coinIds.length < 1) {
    return newRecords
  }

  return newRecords.concat(await syncCoins(coinIds))
}

async function syncPlatforms(coin, platforms, bep2tokens) {
  const upsert = async (type, decimals, address, symbol) => {
    try {
      const [record] = await Platform.upsert({ type, symbol, address, decimals, coin_id: coin.id })
      console.log(JSON.stringify(record))
    } catch (err) {
      console.log(err)
    }
  }

  switch (coin.uid) {
    case 'bitcoin':
    case 'bitcoin-cash':
    case 'litecoin':
    case 'dash':
    case 'zcash':
      return upsert(coin.uid, 8)
    case 'ethereum':
      return upsert('ethereum', 18)
    case 'binancecoin':
      await upsert('binance-smart-chain', 18)
      await upsert('bep2', 18, null, 'BNB')
      return
    default:
      break
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const platform in platforms) {
    if (!platform) {
      continue
    }

    let type = platform
    let symbol
    let decimals
    let address

    switch (platform) {
      case 'ethereum':
        type = 'erc20'
        address = platforms[platform]
        decimals = await web3Provider.getERC20Decimals(address)
        break

      case 'binance-smart-chain':
        type = 'bep20'
        address = platforms[platform]
        decimals = await web3Provider.getBEP20Decimals(address)
        break

      case 'binancecoin': {
        type = 'bep2'
        const token = bep2tokens[coin.code.toUpperCase()]
        if (token) {
          decimals = token.contract_decimals
          symbol = token.symbol
        }
        break
      }

      default:
        address = platforms[platform]
        break
    }

    await upsert(type, decimals, address, symbol)
  }
}

function descriptionsMap(descriptions, languages) {
  return languages.reduce((memo, lang) => {
    const description = descriptions[lang.code]
    if (description) {
      memo[lang.code] = turndownService.turndown(description)
    }
    return memo
  }, {})
}

async function syncCoinInfo(coin, languages, bep2tokens) {
  try {
    console.log('Fetching info for', coin.uid)

    const coinInfo = await coingecko.getCoinInfo(coin.uid)
    const cached = coinsCache[coin.uid] || {}
    const values = {
      links: coinInfo.links,
      is_defi: coinInfo.is_defi,
      description: cached.description || descriptionsMap(coinInfo.description, languages),
      genesis_date: cached.genesis_date || coin.genesis_date,
      security: cached.security || coin.security
    }

    await coin.update(values)
    await syncPlatforms(coin, coinInfo.platforms, bep2tokens)
  } catch ({ message, response }) {
    console.error(message)
    if (response && response.status === 429) {
      await sleep(60 * 1000)
      await syncCoinInfo(coin, languages, bep2tokens)
    }
  }
}

async function start() {
  await sequelize.sync()

  const languages = await Language.findAll()
  const bep2tokens = await binanceDex.getBep2Tokens()
  const coinIds = (await coingecko.getCoinList()).map(coin => coin.id)
  const coins = await syncCoins(coinIds)

  console.log(`Fetched new coins ${coins.length}`)

  for (let i = 0; i < coins.length; i += 1) {
    try {
      await syncCoinInfo(coins[i], languages, bep2tokens)
      await sleep(1100)
    } catch (e) {
      console.error(e)
    }
  }
}

module.exports = start()
