const TurndownService = require('turndown')
const { chunk, difference, intersection, isObject } = require('lodash')
const { sleep } = require('../utils')
const Syncer = require('./Syncer')
const Coin = require('../db/models/Coin')
const Chain = require('../db/models/Chain')
const UpdateState = require('../db/models/UpdateState')
const Platform = require('../db/models/Platform')
const Exchange = require('../db/models/Exchange')
const Language = require('../db/models/Language')
const coingecko = require('../providers/coingecko')
const web3Provider = require('../providers/web3')
const gpt = require('../providers/chat-gpt')
const grok = require('../providers/grok-ai')
const gemini = require('../providers/gemini-ai')
const coinsJoin = require('../db/seeders/coins.json')

class SetupCoins extends Syncer {
  constructor() {
    super()

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

  async sync() {
    console.log('Started syncing new coins once a day')
    this.cron('1d', async () => {
      const newCoins = await this.fetchNewCoinList()
      if (newCoins.length) {
        await this.setupCoins(newCoins)
      }
    })
  }

  async fetchNewCoinList() {
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

    const filteredNewCoins = filtered.map(coin => coin.uid)
    console.log(`Coins with market data ${coins.length}; ${filtered.length} coins with volume >= ${this.MIN_24_VOLUME}`)
    console.log(filteredNewCoins.join(','))

    return filteredNewCoins
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

  async setupCoins(coinIds, force) {
    const exchanges = await Exchange.getUids()
    const coins = await this.fetchCoinInfo(coinIds)
    const languages = await Language.findAll({
      where: { code: ['en'] }
    })

    console.log(`Syncing (${coins.length}) new coins`)

    for (let i = 0; i < coins.length; i += 1) {
      await this.syncCoinInfo(coins[i], languages, exchanges, force)
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
          await platform.update({ decimals, type: provider.type })
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

  async fetchCoinInfo(coinIds) {
    console.log(`Fetching coins ${coinIds.length}`)
    const coinIdsPerPage = coinIds.splice(0, 420)
    const coins = await coingecko.getMarkets(coinIdsPerPage)

    if (coins.length >= (coinIdsPerPage.length + coinIds.length) || coinIds.length < 1) {
      return coins
    }

    return coins.concat(await this.fetchCoinInfo(coinIds))
  }

  async syncPlatforms(coin, platforms) {
    if (this.ignorePlatforms.includes(coin.uid)) {
      return
    }

    for (let i = 0; i < platforms.length; i += 1) {
      const [platform, details] = platforms[i]

      if (!platform) {
        await Chain.findOrCreate({
          where: { uid: coin.uid },
          defaults: { name: coin.name }
        })
        continue
      }

      if (!isObject(details) || !details.contract_address) {
        continue
      }

      let newType = platform
      let decimals = details.decimal_place
      let provider = web3Provider.getProvider(platform)
      let symbol

      const mapper = number => {
        decimals = number
      }

      switch (platform) {
        case 'ethereum':
        case 'polygon-pos':
        case 'optimistic-ethereum':
        case 'arbitrum-one':
        case 'avalanche':
        case 'base':
        case 'binance-smart-chain':
          newType = 'eip20'
          break

        case 'binancecoin': {
          newType = 'bep2'
          provider = null
          symbol = details.contract_address
          break
        }

        case 'solana': {
          newType = 'spl'
          provider = null
          break
        }
        default:
      }

      if (provider) {
        try {
          mapper(await provider.getDecimals(details.contract_address))
        } catch ({ message }) {
          console.log(message)

          if (message.match(/^Returned values aren't valid/) || message.match(/^Provided address [\s\S]+ is invalid/)) {
            console.log('Skipped adding platform', details.contract_address)
            continue
          }
        }
      }

      const values = { type: newType, decimals, address: details.contract_address, symbol, coin_id: coin.id, chain_uid: platform }
      await this.upsertPlatform(values, platform)
    }
  }

  async syncDescriptions(coin, descriptions, languages) {
    const result = {}
    for (let i = 0; i < languages.length; i += 1) {
      const language = languages[i];
      const oldDescription = descriptions[language.code]

      let description = await gpt.getCoinDescription(oldDescription || coin, language)
      if (!description) {
        description = await grok.getCoinDescription(oldDescription || coin, language)
      }
      if (!description) {
        description = await gemini.getCoinDescription(oldDescription || coin, language)
      }
      if (!description && oldDescription) {
        description = this.turndownService.turndown(oldDescription)
      }

      if (description) {
        result[language.code] = description
      }
    }

    return result
  }

  async syncCoinInfo(coin, languages, exchanges, force) {
    try {
      console.log('Fetching info for', coin.uid)

      const coinInfo = await coingecko.getCoinInfo(coin.uid)
      const cached = this.coinsCache[coin.uid] || {}
      const values = {
        ...coin,
        links: coinInfo.links,
        is_defi: coinInfo.is_defi,
        genesis_date: cached.genesis_date || coin.genesis_date,
        security: cached.security || coin.security
      }

      let volume = 0
      for (let i = 0; i < coinInfo.tickers.length; i += 1) {
        const ticker = coinInfo.tickers[i];
        if (exchanges[ticker.market.identifier]) {
          volume += ticker.converted_volume.usd
        }
      }

      values.description = await this.syncDescriptions(coin.name, coinInfo.description, languages)
      if (volume >= this.MIN_24_VOLUME_TRUSTED || force) {
        // const [record] = await Coin.upsert(values)
        // await this.syncPlatforms(record, Object.entries(coinInfo.detail_platforms))
      }
    } catch (err) {
      await this.handleError(err)
    }
  }

  async syncChains(uid) {
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
        await this.syncPlatforms(coin, Object.entries(coinInfo.detail_platforms))
        await sleep(2000)
      } catch (err) {
        await this.handleError(err)
        await sleep(2000)
      }
    }
  }

  async upsertPlatform(values, platformChainName) {
    const platform = await Platform.findOne({
      where: {
        coin_id: values.coin_id,
        type: platformChainName
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
        console.log('Platform inserted', JSON.stringify({ type, chain, id }))
      })
      .catch(err => {
        console.log('Error inserting platform', err)
      })
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
