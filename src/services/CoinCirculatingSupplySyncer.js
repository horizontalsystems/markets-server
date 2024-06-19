const { chunk } = require('lodash')
const Syncer = require('./Syncer')
const Platform = require('../db/models/Platform')
const utils = require('../utils')
const defillama = require('../providers/defillama')
const etherscan = require('../providers/etherscan')
const optimistic = require('../providers/etherscan-optimistic')
const arbiscan = require('../providers/arbiscan')
const polygonscan = require('../providers/polygonscan')
const snowtrace = require('../providers/snowtrace')
const tronscan = require('../providers/tronscan')
const bscscan = require('../providers/bscscan')
const solscan = require('../providers/solscan')
const cronoscan = require('../providers/cronoscan')
const ftmscan = require('../providers/ftmscan')
const celoscan = require('../providers/celoscan')
const geckoterminal = require('../providers/geckoterminal')

class CoinCirculatingSupplySyncer extends Syncer {

  async sync({ uids, chain }) {
    const map = {}
    const platforms = await Platform.getMarketCap(uids, chain)
    const stablecoins = await defillama.getStablecoins()

    for (let i = 0; i < platforms.length; i += 1) {
      const platform = platforms[i]

      let supply = platform.csupply
      if (platform.multi_chain_id || !supply) {
        supply = await this.getSupply(platform, stablecoins)
        await utils.sleep(500)
      }

      if (supply) {
        map[platform.id] = supply
      }
    }

    const chunks = chunk(Object.entries(map), 1000)
    for (let i = 0; i < chunks.length; i += 1) {
      await this.update(chunks[i])
    }
  }

  async getSupply(platform, stablecoins) {
    const stablecoin = stablecoins[platform.uid]
    if (stablecoin) {
      console.log('Stablecoin supply for', platform.uid, platform.chain_uid, platform.address)
      return stablecoin[platform.chain_uid]
    }

    switch (platform.uid) {
      case 'stepn':
        if (platform.type === 'spl') {
          return platform.csupply
        }
        break
      default:
    }

    let supply
    switch (platform.chain_uid) {
      case 'ethereum':
        supply = await this.fetchSupply(platform, etherscan)
        break
      case 'binance-smart-chain':
        supply = await this.fetchSupply(platform, bscscan)
        break
      case 'optimistic-ethereum':
        supply = await this.fetchSupply(platform, optimistic)
        break
      case 'arbitrum-one':
        supply = await this.fetchSupply(platform, arbiscan)
        break
      case 'polygon-pos':
        supply = await this.fetchSupply(platform, polygonscan)
        break
      case 'avalanche':
        supply = await this.fetchSupply(platform, snowtrace)
        break
      case 'cronos':
        supply = await this.fetchSupply(platform, cronoscan)
        break
      case 'fantom':
        supply = await this.fetchSupply(platform, ftmscan)
        break
      case 'celo':
        supply = await this.fetchSupply(platform, celoscan)
        break
      case 'tron':
        supply = await this.fetchSupplyTron(platform)
        break
      case 'solana':
        supply = await this.fetchSupplySolana(platform)
        break
      case 'binancecoin':
        if (platform.uid !== 'binancecoin') {
          supply = platform.csupply
        }
        break
      default:
        supply = await this.fetchSupplyByNetwork(platform.chain_uid, platform.address)
    }

    if (supply > platform.csupply && platform.csupply > 0) {
      supply = platform.csupply
    }

    // if (supply === undefined) {
    //   supply = platform.csupply
    // }

    return supply
  }

  async fetchSupply(platform, provider) {
    if (!platform.decimals || !platform.address) {
      return null
    }

    const supply = await provider.getTokenSupply(platform.address)
    if (supply) {
      return supply / (10 ** platform.decimals)
    }
  }

  async fetchSupplyTron(platform) {
    if (!platform.address) {
      return null
    }

    const token = await tronscan.getTokenInfo(platform.address)
    if (!token) {
      return null
    }

    if (token.total_supply_with_decimals && token.decimals) {
      return token.total_supply_with_decimals / (10 ** token.decimals)
    }

    return null
  }

  async fetchSupplySolana(platform) {
    if (!platform.address) {
      return null
    }

    const token = await solscan.getTokenInfo(platform.address)
    if (!token || !token.decimals || !token.supply) {
      return null
    }

    return token.supply / 10 ** token.decimals
  }

  async fetchSupplyByNetwork(chain, address) {
    if (!chain || !address) {
      return null
    }

    const network = geckoterminal.mapChainToNetwork(chain)
    if (!network) {
      return null
    }

    const token = await geckoterminal.getTokenInfo(network, address)

    if (!token.market_cap_usd || !token.token_price_usd) {
      return null
    }

    await utils.sleep(300)

    return token.market_cap_usd / token.token_price_usd
  }

  update(values) {
    return Platform.updateCSupplies(values)
      .then(() => {
        console.log('Updated platforms circulating supplies', values.length)
      })
      .catch(e => {
        console.log(e)
      })
  }

}

module.exports = CoinCirculatingSupplySyncer
