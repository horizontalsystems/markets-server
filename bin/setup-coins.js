const TurndownService = require('turndown')
const { sleep } = require('../src/utils')
const coingecko = require('../src/providers/coingecko')
const sequelize = require('../src/db/sequelize')
const Coin = require('../src/db/models/Coin')
const Platform = require('../src/db/models/Platform')
const Language = require('../src/db/models/Language')
const binanceDex = require('../src/providers/binance-dex')
const web3Provider = require('../src/providers/web3')

const turndownService = new TurndownService()

async function fetchCoins(page = 1, limit = 4000) {
  const coinsPerPage = 250
  const coins = await coingecko.getMarkets(null, page, coinsPerPage)

  console.log(`Fetched coins ${coins.length}; Page: ${page}; Limit: ${limit}`)

  if (coins.length < coinsPerPage || coins.length >= limit) {
    return coins
  }

  return coins.concat(
    await fetchCoins(page + 1, limit - coinsPerPage)
  )
}

async function createPlatform(coin, platforms, bep2tokens) {
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
      await upsert('bep2', 18, null, 'bnb')
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

async function creatCoin(id, languages, bep2tokens) {
  try {
    console.log('fetching info for', id)
    const data = await coingecko.getCoinInfo(id)
    data.description = descriptionsMap(data.description, languages)

    const [coin] = await Coin.upsert(data)
    await createPlatform(coin, data.platforms, bep2tokens)
  } catch ({ message, response }) {
    console.error(message)
    if (response && response.status === 429) {
      await sleep(60 * 1000)
      await creatCoin(id, languages, bep2tokens)
    }
  }
}

async function start() {
  await sequelize.sync()

  const languages = await Language.findAll()
  const bep2tokens = await binanceDex.getBep2Tokens()
  const coins = await fetchCoins()
  console.log(`Fetched new coins ${coins.length}`)

  for (let i = 0; i < coins.length; i += 1) {
    try {
      const coin = coins[i]
      await creatCoin(coin.coingecko_id, languages, bep2tokens)
      await sleep(1100)
    } catch (e) {
      console.error(e)
    }
  }
}

start()
  .catch(err => {
    console.log(err.stack)
  })
  .finally(() => {
    process.exit(0)
  })
