const TurndownService = require('turndown')
const { difference, chunk } = require('lodash')
const { sleep } = require('../utils')
const Coin = require('../db/models/Coin')
const Platform = require('../db/models/Platform')
const Language = require('../db/models/Language')
const coingecko = require('../providers/coingecko')
const binanceDex = require('../providers/binance-dex')
const web3Provider = require('../providers/web3')
const solscan = require('../providers/solscan')
const coinsJoin = require('../db/seeders/coins.json')

class SetupCoins {

  constructor() {
    this.coinsCache = coinsJoin.reduce((result, item) => ({ ...result, [item.uid]: item }), {})
    this.turndownService = new TurndownService()
      .addRule('remove_links', {
        filter: node => node.nodeName === 'A' && node.getAttribute('href'),
        replacement: content => content
      })
  }

  async fetchCoins(minVolume) {
    const allCoins = await coingecko.getCoinList()
    const oldCoins = await Coin.findAll()
    const newCoins = difference(allCoins.map(coin => coin.id), oldCoins.map(coin => coin.uid))

    console.log('Fetched new coins', newCoins.length)

    const chunks = chunk(newCoins, 400)
    const coins = []

    for (let i = 0; i < chunks.length; i += 1) {
      const data = await coingecko.getMarkets(chunks[i])
      coins.push(...data)
    }

    const filtered = coins.filter(coin => {
      if (!coin.market_data || !coin.market_data.total_volume) {
        return false
      }

      return coin.market_data.total_volume >= minVolume
    })

    console.log(`Coins with market data ${coins.length}; ${filtered.length} coins with volume >= ${minVolume}`)
    console.log(filtered.map(coin => coin.uid).join(','))
  }

  async setupCoins(ids) {
    const languages = await Language.findAll()
    const bep2tokens = await binanceDex.getBep2Tokens()
    const coinIds = ids || (await coingecko.getCoinList()).map(coin => coin.id)
    const coins = await this.syncCoins(coinIds, !ids)

    console.log(`Synced new coins ${coins.length}`)

    for (let i = 0; i < coins.length; i += 1) {
      await this.syncCoinInfo(coins[i], languages, bep2tokens)
      await sleep(1100)
    }
  }

  async forceSyncPlatforms(type) {
    const platforms = await Platform.findAll({
      where: {
        type
      }
    })

    for (let i = 0; i < platforms.length; i += 1) {
      const platform = platforms[i]

      let getDecimals
      switch (platform.type) {
        case 'optimism':
          getDecimals = web3Provider.getOptimismDecimals
          break
        case 'arbitrum-one':
          getDecimals = web3Provider.getArbitrumOneDecimals
          break
        case 'binance-smart-chain':
          getDecimals = web3Provider.getBEP20Decimals
          break
        case 'polygon-pos':
          getDecimals = web3Provider.getMRC20Decimals
          break
        default:
          getDecimals = web3Provider.getERC20Decimals
          break
      }

      const decimals = await getDecimals(platform.address)
      console.log(`Fetched decimals (${decimals}) for ${platform.address} ${i + 1}; `)
      await platform.update({ decimals })
    }
  }

  async syncCoins(coinIds, returnOnlyNew) {
    console.log(`Fetching coins ${coinIds.length}`)
    const coinIdsPerPage = coinIds.splice(0, 420)

    const coins = await coingecko.getMarkets(coinIdsPerPage)
    const options = returnOnlyNew
      ? { ignoreDuplicates: true }
      : { updateOnDuplicate: ['price', 'price_change', 'last_updated'] }

    const allRecords = await Coin.bulkCreate(coins, options)
    const newRecords = allRecords.filter(record => record.id)

    if (coins.length >= (coinIdsPerPage.length + coinIds.length) || coinIds.length < 1) {
      return newRecords
    }

    return newRecords.concat(await this.syncCoins(coinIds, returnOnlyNew))
  }

  async syncPlatforms(coin, platforms, bep2tokens) {
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
        await upsert('ethereum', 18)
        await upsert('ethereum-optimism', 18)
        await upsert('ethereum-arbitrum-one', 18)
        return
      case 'matic-network':
        return upsert('polygon', 18)
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

        case 'polygon-pos':
          type = 'mrc20'
          address = platforms[platform]
          decimals = await web3Provider.getMRC20Decimals(address)
          break

        case 'optimistic-ethereum':
          type = 'optimistic-ethereum'
          address = platforms[platform]
          decimals = await web3Provider.getOptimismDecimals(address)
          break

        case 'arbitrum-one':
          type = 'arbitrum-one'
          address = platforms[platform]
          decimals = await web3Provider.getArbitrumOneDecimals(address)
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

        case 'solana': {
          address = platforms[platform]
          const meta = await solscan.getMeta(address)
          if (meta) {
            decimals = meta.decimals
            symbol = meta.symbol
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

  async syncCoinInfo(coin, languages, bep2tokens) {
    try {
      console.log('Fetching info for', coin.uid)

      const coinInfo = await coingecko.getCoinInfo(coin.uid)
      const cached = this.coinsCache[coin.uid] || {}
      const values = {
        links: coinInfo.links,
        is_defi: coinInfo.is_defi,
        description: cached.description || this.mapDescriptions(coinInfo.description, languages),
        genesis_date: cached.genesis_date || coin.genesis_date,
        security: cached.security || coin.security
      }

      await coin.update(values)
      await this.syncPlatforms(coin, coinInfo.platforms, bep2tokens)
    } catch ({ message, response = {} }) {
      if (message) {
        console.error(message)
      }

      if (response.status === 429) {
        await sleep(60 * 1000)
        await this.syncCoinInfo(coin, languages, bep2tokens)
      }
    }
  }

  mapDescriptions(descriptions, languages) {
    return languages.reduce((result, { code }) => {
      if (!descriptions[code]) {
        return result
      }

      return {
        ...result,
        [code]: this.turndownService.turndown(descriptions[code])
      }
    }, {})
  }
}

module.exports = SetupCoins
