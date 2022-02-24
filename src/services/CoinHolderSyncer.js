/* eslint-disable no-param-reassign */
const cheerio = require('cheerio')
const etherscan = require('../providers/etherscan')
const bscscan = require('../providers/bscscan')
const solscan = require('../providers/solscan')
const Platform = require('../db/models/Platform')
const CoinHolder = require('../db/models/CoinHolder')
const Syncer = require('./Syncer')
const utils = require('../utils')
const logger = require('../config/logger')

class CoinHolderSyncer extends Syncer {
  async start() {
    await this.syncHistorical()
    await this.syncLatest()
  }

  async syncHistorical() {
    await Promise.all([
      this.syncHolders('ethereum'),
      this.syncHolders('binance-smart-chain'),
      this.syncFromSolscan()
    ])
  }

  async syncLatest() {
    this.cron('0 0 1 * *', this.syncMonthly) // once a month
  }

  async syncMonthly() {
    await Promise.all([
      this.syncHolders('ethereum'),
      this.syncHolders('binance-smart-chain'),
      this.syncFromSolscan()
    ])
  }

  async syncHolders(chain) {
    let provider
    let platformTypes

    switch (chain) {
      case 'ethereum': {
        provider = etherscan
        platformTypes = [chain, 'erc20']
        break;
      }
      case 'binance-smart-chain': {
        provider = bscscan
        platformTypes = [chain, 'bep20']
        break;
      }
      default:
        return
    }

    const platforms = await this.getPlatforms(platformTypes)
    console.log(`${chain} platforms ${platforms.list.length}`)

    for (let i = 0; i < platforms.list.length; i += 1) {
      const address = platforms.list[i]
      const platform = platforms.map[address]

      console.log(`Fetching major holders for ${chain} ${address} (${i})`)

      await provider.getHolders(address)
        .then(data => this.mapTokenHolders(data, platform))
        .then(data => this.upsert(data, platform))
        .catch(e => {
          console.log('Error fetching holders', e.message)
        })

      await utils.sleep(1000)
    }

    await provider.getAccounts()
      .then(data => this.mapChainHolders(data, platforms.map[chain]))
      .then(data => this.upsert(data, platforms.map[chain]))
      .catch(e => {
        console.log('Error fetching accounts', e.message)
      })
  }

  async syncFromSolscan() {
    const platforms = await this.getPlatforms('solana')
    console.log('Solana platforms', platforms.list.length)

    for (let i = 0; i < platforms.list.length; i += 1) {
      const address = platforms.list[i]
      const platform = platforms.map[address]

      console.log(`Fetching major holders from 'solscan' (${i}); ${address}`)

      await Promise.all([
        solscan.getHolders(address),
        solscan.getTokenInfo(address)
      ])
        .then(data => this.mapSolanaHolders(data[0], platform, data[1]))
        .then(data => this.upsert(data, platform))
        .catch(err => {
          if (err.message) {
            console.log('Error fetching from solscan', err.message)
          }

          if (err.response && err.response.status === 429) {
            logger.error('Sleeping 15sec')
            return utils.sleep(15000)
          }
        })

      await utils.sleep(500)
    }
  }

  async getPlatforms(types) {
    const platforms = await Platform.getByTypes(types, false, false)
    const list = []
    const map = {}

    platforms.forEach(({ address, id, type }) => {
      map[address] = id
      if (address) {
        list.push(address)
      }

      if (type === 'ethereum') {
        map.ethereum = id
      }

      if (type === 'binance-smart-chain') {
        map['binance-smart-chain'] = id
      }
    })

    return { list, map }
  }

  mapHoldersData(addressItem, quantityItem, percentageItem, platformId) {
    try {
      const addressHref = addressItem.find('a').attr('href')

      let address
      if (addressHref) {
        const { searchParams } = new URL(addressHref, 'https://domain.com')
        address = searchParams.get('a')
      }

      if (!address) {
        address = addressItem.text()
      }

      const quantity = quantityItem.text()
      const percentage = parseFloat(percentageItem.text())

      return {
        address,
        percentage: percentage || 0,
        platform_id: platformId,
        balance: parseFloat(quantity.replace(/,/g, '')) || 0
      }
    } catch (e) {
      console.log('Error mapping holders', e.message)
      return null
    }
  }

  mapChainHolders(data, platformId) {
    const $ = cheerio.load(data)
    const items = $('table>tbody>tr')

    return items.filter(i => i < 10).map((i, item) => {
      return this.mapHoldersData(
        $(item.children[1]),
        $(item.children[3]),
        $(item.children[4]),
        platformId
      )
    }).toArray().filter(i => i)
  }

  mapTokenHolders(data, platformId) {
    const $ = cheerio.load(data)
    const items = $('table>tbody>tr')

    return items.map((i, item) => {
      return this.mapHoldersData(
        $(item.children[1]),
        $(item.children[2]),
        $(item.children[3]),
        platformId
      )
    }).toArray().filter(i => i)
  }

  mapSolanaHolders(data, platformId, token) {
    return data.map(holder => {
      if (!token || !token.decimals || !token.supply) {
        return null
      }

      const decimals = 10 ** token.decimals
      const balance = holder.amount / decimals
      const supply = token.supply / decimals

      return {
        supply,
        balance,
        address: holder.address,
        percentage: (balance * 100) / supply,
        platform_id: platformId
      }
    }).filter(i => i)
  }

  async upsert(holders, platform) {
    if (!platform || !holders.length) {
      return
    }

    if (holders.every(h => h.percentage === 0 || h.percentage === '0')) {
      return
    }

    await CoinHolder.deleteAll(platform)
    await CoinHolder.bulkCreate(holders)
      .then(data => {
        console.log('Inserted coin holders', data.length)
      })
      .catch(err => {
        console.error('Error inserting coin holders', err.message)
      })
  }
}

module.exports = CoinHolderSyncer
