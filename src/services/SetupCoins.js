const TurndownService = require('turndown')
const { chunk, difference } = require('lodash')
const { sleep } = require('../utils')
const Coin = require('../db/models/Coin')
const Chain = require('../db/models/Chain')
const UpdateState = require('../db/models/UpdateState')
const Platform = require('../db/models/Platform')
const Language = require('../db/models/Language')
const coingecko = require('../providers/coingecko')
const binanceDex = require('../providers/binance-dex')
const web3Provider = require('../providers/web3')
const solscan = require('../providers/solscan')
const coinsJoin = require('../db/seeders/coins.json')

class SetupCoins {

  constructor() {
    this.ignorePlatforms = ['ankr-reward-earning-staked-eth', 'binance-peg-ethereum']
    this.coinsCache = coinsJoin.reduce((result, item) => ({ ...result, [item.uid]: item }), {})
    this.turndownService = new TurndownService()
      .addRule('remove_links', {
        filter: node => node.nodeName === 'A' && node.getAttribute('href'),
        replacement: content => content
      })
  }

  async fetchCoins(minVolume, minMCap) {
    const allCoins = await coingecko.getCoinList()
    const oldCoins = await Coin.findAll({ attributes: ['coingecko_id'] })
    const newCoins = difference(allCoins.map(coin => coin.id), oldCoins.map(coin => coin.coingecko_id))

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

      return coin.market_data.total_volume >= minVolume && coin.market_data.market_cap >= minMCap
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

    if (coins.length) {
      await UpdateState.reset('coins')
    }
  }

  async forceSyncDecimals({ chain, type, address }) {
    const where = {
      ...(address && { address }),
      ...(type && { type }),
      ...(chain && { chain_uid: chain }),
      decimals: Platform.literal('decimals IS NULL')
    }
    const platforms = await Platform.findAll({ where })

    console.log(`Syncing decimals for ${platforms.length} platforms`)

    for (let i = 0; i < platforms.length; i += 1) {
      const platform = platforms[i]

      let getDecimals
      switch (platform.chain_uid) {
        case 'optimism':
        case 'optimistic-ethereum':
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
        case 'avalanche':
          getDecimals = web3Provider.getAvalancheDecimals
          break
        case 'cronos':
          getDecimals = web3Provider.getCronosDecimals
          break
        case 'fantom':
          getDecimals = web3Provider.getFantomDecimals
          break
        case 'celo':
          getDecimals = web3Provider.getCeloDecimals
          break
        case 'ethereum':
          getDecimals = web3Provider.getERC20Decimals
          break
        default:
          continue
      }

      const decimals = await getDecimals(platform.address)
      console.log(`Fetched decimals (${decimals}) for ${platform.address} ${i + 1}; `)
      if (decimals && decimals > 0) {
        await platform.update({ decimals })
      }
    }

    await UpdateState.reset('platforms')
    await UpdateState.reset('tokens')
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
      let resolver
      let symbol
      let mapper = data => {
        decimals = data
      }

      switch (platform) {
        case 'ethereum':
          newType = 'eip20'
          oldType = 'erc20'
          resolver = web3Provider.getERC20Decimals
          break

        case 'binance-smart-chain':
          newType = 'eip20'
          oldType = 'bep20'
          resolver = web3Provider.getBEP20Decimals
          break

        case 'polygon-pos':
          newType = 'eip20'
          resolver = web3Provider.getMRC20Decimals
          break

        case 'optimistic-ethereum':
          newType = 'eip20'
          resolver = web3Provider.getOptimismDecimals
          break

        case 'arbitrum-one':
          newType = 'eip20'
          resolver = web3Provider.getArbitrumOneDecimals
          break

        case 'avalanche':
          newType = 'eip20'
          resolver = web3Provider.getAvalancheDecimals
          break

        case 'binancecoin': {
          newType = 'bep2'
          const token = bep2tokens[coin.code.toUpperCase()]
          if (token) {
            decimals = token.contract_decimals
            symbol = token.symbol
          }
          break
        }

        case 'solana': {
          resolver = solscan.getMeta
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

      if (resolver && !platformOld) {
        await resolver(address).then(data => mapper(data))
      }

      if (platform) {
        await upsertPlatform(platform, oldType, { type: newType, decimals, address, symbol })
      } else if (!address) {
        await upsertPlatform(coin.uid, oldType, { type: 'native', decimals, address })
      }
    }
  }

  async syncCoinInfo(coin, languages, bep2tokens) {
    try {
      console.log('Fetching info for', coin.uid)

      const mapDescriptions = descriptions => languages.reduce((result, { code }) => {
        if (!descriptions[code]) {
          return result
        }

        return { ...result, [code]: this.turndownService.turndown(descriptions[code]) }
      }, {})

      const coinInfo = await coingecko.getCoinInfo(coin.uid)
      const cached = this.coinsCache[coin.uid] || {}
      const values = {
        links: coinInfo.links,
        is_defi: coinInfo.is_defi,
        description: cached.description || mapDescriptions(coinInfo.description, languages),
        genesis_date: cached.genesis_date || coin.genesis_date,
        security: cached.security || coin.security
      }

      await coin.update(values)
      await this.syncPlatforms(coin, Object.entries(coinInfo.platforms), bep2tokens)
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
