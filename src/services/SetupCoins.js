const TurndownService = require('turndown')
const { chunk, difference, intersection } = require('lodash')
const { sleep } = require('../utils')
const Coin = require('../db/models/Coin')
const Chain = require('../db/models/Chain')
const UpdateState = require('../db/models/UpdateState')
const Platform = require('../db/models/Platform')
const Exchange = require('../db/models/Exchange')
const Language = require('../db/models/Language')
const coingecko = require('../providers/coingecko')
const binanceDex = require('../providers/binance-dex')
const web3Provider = require('../providers/web3')
const solscan = require('../providers/solscan')
const gpt = require('../providers/chat-gpt')
const coinsJoin = require('../db/seeders/coins.json')

class SetupCoins {

  constructor() {
    this.MIN_24_VOLUME = 200000
    this.MIN_24_VOLUME_TRUSTED = 500000
    this.MIN_MCAP = 10000000

    this.ignorePlatforms = ['ankr-reward-earning-staked-eth', 'binance-peg-ethereum']
    this.coinsCache = coinsJoin.reduce((result, item) => ({ ...result, [item.uid]: item }), {})
    this.turndownService = new TurndownService()
      .addRule('remove_links', {
        filter: node => node.nodeName === 'A' && node.getAttribute('href'),
        replacement: content => content
      })
  }

  async fetchCoins() {
    const allCoins = await coingecko.getCoinList()
    const oldCoins = await Coin.findAll({ attributes: ['coingecko_id'] })
    const newCoins = difference(allCoins.map(coin => coin.id), oldCoins.map(coin => coin.coingecko_id))

    console.log('Fetched new coins', newCoins.length)

    const chunks = chunk(newCoins, 250)
    const coins = []

    for (let i = 0; i < chunks.length; i += 1) {
      const data = await coingecko.getMarkets(chunks[i])
      await sleep(20000)
      coins.push(...data)
    }

    const filtered = coins.filter(coin => {
      if (!coin.market_data || !coin.market_data.total_volume) {
        return false
      }

      return coin.market_data.total_volume >= this.MIN_24_VOLUME && coin.market_data.market_cap >= this.MIN_MCAP
    })

    console.log(`Coins with market data ${coins.length}; ${filtered.length} coins with volume >= ${this.MIN_24_VOLUME}`)
    console.log(filtered.map(coin => coin.uid).join(','))
  }

  async orphanedCoins() {
    const allCoins = await coingecko.getCoinList()
    const oldCoins = await Coin.findAll({
      attributes: ['uid'],
      where: { coingecko_id: Coin.literal('coingecko_id is null') }
    })
    console.log(`All coins: ${allCoins.length}; old coins: ${oldCoins.length}`)
    const matchCoins = intersection(allCoins.map(coin => coin.id), oldCoins.map(coin => coin.coingecko_id))
    console.log(matchCoins)
  }

  async setupCoins(ids) {
    const exchanges = await Exchange.getUids()
    const bep2tokens = await binanceDex.getBep2Tokens()
    const coinIds = ids || (await coingecko.getCoinList()).map(coin => coin.id)
    const coins = await this.syncCoins(coinIds, !ids)
    const languages = await Language.findAll({
      where: { code: ['en', 'de', 'ru'] }
    })

    console.log(`Synced new coins ${coins.length}`)

    for (let i = 0; i < coins.length; i += 1) {
      await this.syncCoinInfo(coins[i], languages, bep2tokens, exchanges)
      await sleep(20000)
    }

    if (coins.length) {
      await UpdateState.reset('coins')
    }
  }

  async forceSyncDecimals({ chain, type, address, uid }) {
    const where = {
      ...(address && { address }),
      ...(type && { type }),
      ...(chain && { chain_uid: chain }),
      decimals: Platform.literal('decimals IS NULL')
    }
    if (uid) {
      await Coin.findOne({ where: { uid }, attributes: ['id'] }).then(coin => {
        where.coin_id = coin.id
      })
    }
    const platforms = await Platform.findAll({ where })

    console.log(`Syncing decimals for ${platforms.length} platforms`)

    for (let i = 0; i < platforms.length; i += 1) {
      const platform = platforms[i]
      const provider = web3Provider.getProvider(platform.chain_uid)

      try {
        const decimals = await provider.getDecimals(platform.address)
        console.log(`Fetched decimals (${decimals}) for ${platform.address} ${i + 1}`)

        if (decimals > 0) {
          await platform.update({ decimals, type: 'eip20' })
        }
      } catch ({ message }) {
        console.log(`Failed to fetch decimals for ${platform.address}; i: ${i + 1}`)
        console.log(message)

        if (!message) continue
        if (message.match(/^Returned values aren't valid/) || message.match(/^Provided address [\s\S]+ is invalid/)) {
          await platform.destroy()
          console.log('Platform removed')
        }
      }
    }

    await UpdateState.reset('platforms')
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
    if (this.ignorePlatforms.includes(coin.uid)) {
      return
    }

    const upsertPlatform = async (chain, oldType, values) => {
      await this.upsertChain(chain, chain === coin.uid ? coin.name : chain)
      await this.upsertPlatform({ ...values, coin_id: coin.id, chain_uid: chain }, oldType)
    }

    switch (coin.uid) {
      case 'bitcoin':
      case 'bitcoin-cash':
      case 'litecoin':
      case 'dash':
      case 'zcash':
        return upsertPlatform(coin.uid, coin.uid, { type: 'native', decimals: 8 })
      case 'ethereum':
        await upsertPlatform('ethereum', 'ethereum', { type: 'native', decimals: 18 })
        await upsertPlatform('arbitrum-one', 'arbitrum-one', { type: 'native', decimals: 18 })
        await upsertPlatform('optimistic-ethereum', 'optimistic-ethereum', { type: 'native', decimals: 18 })
        return
      case 'binancecoin':
        await upsertPlatform('binance-smart-chain', 'binance-smart-chain', { type: 'native', decimals: 18 })
        await upsertPlatform('binancecoin', 'binancecoin', { type: 'native', decimals: 18, symbol: 'BNB' })
        return
      case 'matic-network':
        await upsertPlatform('polygon-pos', 'polygon-pos', { type: 'native', decimals: 18 })
        break
      case 'avalanche':
      case 'avalanche-2':
        await upsertPlatform('avalanche', 'avalanche', { type: 'native', decimals: 18 })
        break
      default:
        break
    }

    for (let i = 0; i < platforms.length; i += 1) {
      const [platform, address] = platforms[i]

      let oldType = platform
      let newType = platform
      let decimals
      let provider = web3Provider.getProvider(platform)
      let symbol
      let mapper = data => {
        decimals = data
      }

      switch (platform) {
        case 'ethereum':
          newType = 'eip20'
          oldType = 'erc20'
          break

        case 'binance-smart-chain':
          newType = 'eip20'
          oldType = 'bep20'
          break

        case 'polygon-pos':
          newType = 'eip20'
          break

        case 'optimistic-ethereum':
          newType = 'eip20'
          break

        case 'arbitrum-one':
          newType = 'eip20'
          break

        case 'avalanche':
          newType = 'eip20'
          break

        case 'binancecoin': {
          newType = 'bep2'
          provider = null
          const token = bep2tokens[coin.code.toUpperCase()]
          if (token) {
            decimals = token.contract_decimals
            symbol = token.symbol
          }
          break
        }

        case 'solana': {
          newType = 'spl'
          provider = { getDecimals: solscan.getMeta }
          mapper = data => {
            decimals = data.decimals
            symbol = data.symbol
          }
          break
        }
        default:
      }

      const platformOld = await Platform.findOne({
        where: {
          coin_id: coin.id,
          type: oldType
        }
      })

      if (provider && !platformOld) {
        try {
          mapper(await provider.getDecimals(address))
        } catch ({ message }) {
          console.log(message)

          if (message.match(/^Returned values aren't valid/) || message.match(/^Provided address [\s\S]+ is invalid/)) {
            console.log('Skipped adding platform', address)
            continue
          }
        }
      }

      if (platform) {
        await upsertPlatform(platform, oldType, { type: newType, decimals, address, symbol })
      } else if (!address) {
        await upsertPlatform(coin.uid, oldType, { type: 'native', decimals, address })
      }
    }
  }

  async syncDescriptions(coin, descriptions, languages) {
    const result = {}
    for (let i = 0; i < languages.length; i += 1) {
      const language = languages[i];
      const message = await gpt.getCoinDescription(descriptions[language.code] || coin, language)

      let description
      if (message) {
        description = message.content
      }

      if (!description && descriptions[language.code]) {
        description = this.turndownService.turndown(descriptions[language.code])
      }

      if (description) {
        result[language.code] = description
      }
    }

    return result
  }

  async syncCoinInfo(coin, languages, bep2tokens, exchanges) {
    try {
      console.log('Fetching info for', coin.uid)

      const coinInfo = await coingecko.getCoinInfo(coin.uid)
      const cached = this.coinsCache[coin.uid] || {}
      const values = {
        links: coinInfo.links,
        is_defi: coinInfo.is_defi,
        description: cached.description || await this.syncDescriptions(coin.name, coinInfo.description, languages),
        genesis_date: cached.genesis_date || coin.genesis_date,
        security: cached.security || coin.security
      }

      let volume = 0
      for (let i = 0; i < coinInfo.tickers.length; i++) {
        const ticker = coinInfo.tickers[i];
        console.log(ticker.market.identifier, exchanges[ticker.market.identifier])
        if (exchanges[ticker.market.identifier]) {
          volume += ticker.converted_volume.usd
        }
      }

      if (volume >= this.MIN_24_VOLUME_TRUSTED) {
        await coin.update(values)
        await this.syncPlatforms(coin, Object.entries(coinInfo.platforms), bep2tokens)
      }
    } catch (err) {
      await this.handleError(err)
    }
  }

  async syncChains(uid) {
    const bep2tokens = await binanceDex.getBep2Tokens()
    const coins = await Coin.findAll({
      attributes: ['id', 'uid', 'code', 'name', 'coingecko_id'],
      where: {
        ...(uid && { uid }),
        coingecko_id: { [Coin.Op.ne]: null }
      }
    })

    console.log(`${coins.length} coins to synced chains`)

    for (let i = 0; i < coins.length; i += 1) {
      const coin = coins[i]

      try {
        console.log(`Syncing chains for ${coin.coingecko_id}; (${i})`)
        const coinInfo = await coingecko.getCoinInfo(coin.coingecko_id)
        await this.syncPlatforms(coin, Object.entries(coinInfo.platforms), bep2tokens)
        await sleep(2000)
      } catch (err) {
        await this.handleError(err)
        await sleep(2000)
      }
    }
  }

  async upsertPlatform(values, oldType) {
    const platform = await Platform.findOne({
      where: {
        coin_id: values.coin_id,
        type: oldType
      }
    })

    if (platform) {
      return platform.update(values)
        .then(() => {
          console.log('Platform updated', JSON.stringify(values))
        })
        .catch(err => {
          console.log('Error updating platform', err.message, (err.parent || {}).message)
        })
    }

    return Platform.bulkCreate([values], { ignoreDuplicates: true })
      .then(([{ id, type, chain_uid: chain }]) => {
        console.log(JSON.stringify({ type, chain, id }))
      })
      .catch(err => {
        console.log('Error inserting platform', err)
      })
  }

  upsertChain(uid, name) {
    return Chain.findOrCreate({ where: { uid }, defaults: { name } })
      .catch(err => console.log('Error inserting chain', err.message, (err.parent || {}).message))
  }

  async handleError({ message, response = {} }) {
    if (message) {
      console.log(message)
    }

    if (response.status === 429) {
      console.error(`Sleeping 60s (setup-coins); Status ${response.status}`)
      await sleep(60000)
    }

    if (response.status >= 502 && response.status <= 504) {
      console.error(`Sleeping 30s (setup-coins); Status ${response.status}`)
      await sleep(30000)
    }
  }
}

module.exports = SetupCoins
