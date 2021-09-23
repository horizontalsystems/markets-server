const { sleep } = require('../src/utils')
const coingecko = require('../src/providers/coingecko')
const sequelize = require('../src/db/sequelize')
const Coin = require('../src/db/models/Coin')
const Platform = require('../src/db/models/Platform')
const Language = require('../src/db/models/Language')
const binanceDex = require('../src/providers/binance-dex')
const web3Provider = require('../src/providers/web3')

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
  switch (coin.uid) {
    case 'bitcoin':
    case 'ethereum':
    case 'binancecoin':
      return
    default:
      break
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const platform in platforms) {
    if (platform === '') {
      continue
    }

    const address = platforms[platform]
    let decimals
    let symbol
    let type

    switch (platform) {
      case 'ethereum':
        type = 'erc20'
        decimals = await web3Provider.getERC20Decimals(address)
        break

      case 'binance-smart-chain':
        type = 'bep20'
        decimals = await web3Provider.getBEP20Decimals(address)
        break

      case 'binancecoin': {
        type = 'bep20'
        decimals = await web3Provider.getBEP20Decimals(address)
        const token = bep2tokens[coin.code]

        if (!decimals && token) {
          type = 'bep2'
          decimals = token.contract_decimals
          symbol = token.symbol
        }
        break
      }

      default:
        continue
    }

    try {
      const values = {
        type,
        symbol,
        address,
        decimals,
        coin_id: coin.id
      }
      console.log(values)
      await Platform.upsert(values)
    } catch (err) {
      console.error(err)
    }
  }
}

function descriptionsMap(descriptions, languages) {
  return languages.reduce((memo, lang) => {
    memo[lang.code] = descriptions[lang.code]
    return memo
  }, {})
}

async function fetchInfo(id, languages, bep2tokens) {
  console.log('fetching info for', id)

  try {
    const data = await coingecko.getCoinInfo(id)
    data.description = descriptionsMap(data.description, languages)

    const [coin] = await Coin.upsert(data)
    await createPlatform(coin, data.platforms, bep2tokens)
  } catch ({ message, response }) {
    console.log(message)
    if (response && response.status === 429) {
      await sleep(30000)
      await fetchInfo(id, languages, bep2tokens)
    }
  }
}

async function start() {
  await sequelize.sync()

  const languages = await Language.findAll()
  const bep2tokens = await binanceDex.getBep2Tokens()
  const coins = await fetchCoins()
  console.log('Fetched new coins')

  for (let i = 0; i < coins.length; i += 1) {
    const coin = coins[i];
    await fetchInfo(coin.coingecko_id, languages, bep2tokens)
    await sleep(1100)
  }
}

start()
  .catch(err => {
    console.log(err.stack)
  })
  .finally(() => {
    process.exit(0)
  })
