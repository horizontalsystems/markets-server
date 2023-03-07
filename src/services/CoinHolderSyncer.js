/* eslint-disable no-param-reassign,import/no-unresolved */
const cheerio = require('cheerio')
const csv = require('csv-parse/sync')
const blockchair = require('../providers/blockchair')
const etherscan = require('../providers/etherscan')
const snowtrace = require('../providers/snowtrace')
const bigquery = require('../providers/bigquery')
const ftmscan = require('../providers/ftmscan')
const optimism = require('../providers/etherscan-optimistic')
const arbiscan = require('../providers/arbiscan')
const celoscan = require('../providers/celoscan')
const cronoscan = require('../providers/cronoscan')
const polygonscan = require('../providers/polygonscan')
const bscscan = require('../providers/bscscan')
const solscan = require('../providers/solscan')
const Platform = require('../db/models/Platform')
const NftAsset = require('../db/models/NftAsset')
const NftHolder = require('../db/models/NftHolder')
const CoinHolderStats = require('../db/models/CoinHolderStats')
const Syncer = require('./Syncer')
const utils = require('../utils')
const logger = require('../config/logger')

class CoinHolderSyncer extends Syncer {
  async start() {
    await this.syncAll()
    await this.syncLatest()
  }

  async syncAll() {
    const platforms = await Platform.getByChain(null, false, false)
    await this.syncHolders(platforms)
  }

  async sync(platforms) {
    await this.syncHolders(platforms)
  }

  async syncNft(contract) {
    const assets = await NftAsset.getByContract(contract)
    await this.syncNftHolders(contract, assets)
  }

  async syncLatest() {
    this.cron('10d', this.syncAll)
  }

  async syncNftHolders(contract, assets) {
    const assetsIds = utils.reduceMap(assets, 'token_id', 'id')
    const holders = await bigquery.getNftHolders(contract, assets.map(i => ({ id: i.token_id })))

    const records = holders.map(item => {
      if (!assetsIds[item.id]) {
        return null
      }

      return {
        asset_id: assetsIds[item.id],
        address: item.address,
        balance: item.balance
      }
    }).filter(item => item)

    if (!records.length) {
      return
    }

    await NftHolder.deleteAll(records.map(i => i.asset_id))
    await NftHolder.bulkCreate(records)
      .then(data => {
        console.log('Inserted NFT holders', data.length)
      })
      .catch(err => {
        console.log('Error inserting NFT holders', err.message)
      })
  }

  async syncHolders(platforms) {
    console.log(`Platforms to sync ${platforms.length}`)

    const resolve = (request, mapper) => request.then(mapper)
    const fetcher = ({ chain_uid: chain, id, type, address }) => {
      switch (chain) {
        case 'bitcoin':
        case 'bitcoin-cash':
        case 'dash':
        case 'dogecoin':
        case 'litecoin':
        case 'zcash':
          return resolve(blockchair.getAddresses(chain), this.mapBlockchairData(id, chain))
        case 'ethereum':
          return type === 'native'
            ? resolve(this.getAccounts(etherscan), this.mapChainHolders(id))
            : resolve(etherscan.getHolders(address), this.mapTokenHolders(id))
        case 'binance-smart-chain':
          return type === 'native'
            ? resolve(this.getAccounts(bscscan), this.mapChainHolders(id))
            : resolve(bscscan.getHolders(address), this.mapTokenHolders(id))
        case 'avalanche':
          return address
            ? resolve(snowtrace.getHolders(address), this.mapTokenHolders(id))
            : resolve(this.getAccounts(snowtrace), this.mapChainHolders(id))
        case 'fantom':
          return address
            ? resolve(ftmscan.getHolders(address), this.mapTokenHolders(id))
            : resolve(this.getAccounts(ftmscan), this.mapChainHolders(id))
        case 'optimistic-ethereum':
          return address
            ? resolve(optimism.getHolders(address), this.mapTokenHolders(id))
            : resolve(this.getAccounts(optimism), this.mapChainHolders(id))
        case 'arbitrum-one':
          return address
            ? resolve(arbiscan.getHolders(address), this.mapTokenHolders(id))
            : resolve(this.getAccounts(arbiscan), this.mapChainHolders(id))
        case 'celo':
          return address
            ? resolve(celoscan.getHolders(address), this.mapTokenHolders(id))
            : resolve(this.getAccounts(celoscan), this.mapChainHolders(id))
        case 'cronos':
          return address
            ? resolve(cronoscan.getHolders(address), this.mapTokenHolders(id))
            : resolve(this.getAccounts(cronoscan), this.mapChainHolders(id))
        case 'polygon':
          return address
            ? resolve(polygonscan.getHolders(address), this.mapTokenHolders(id))
            : resolve(this.getAccounts(polygonscan), this.mapChainHolders(id))
        case 'solana': {
          const requests = [
            solscan.getHolders(address),
            solscan.getTokenInfo(address)
          ]

          return resolve(Promise.all(requests), this.mapSolanaHolders())
        }
        default:
          return null
      }
    }

    for (let i = 0; i < platforms.length; i += 1) {
      const platform = platforms[i]
      const request = fetcher(platform)

      if (!request) {
        continue
      }

      console.log(`Fetching major holders for ${platform.chain_uid}:${platform.type} ${platform.address} (${i + 1})`)

      await request
        .then(data => this.upsert(data, platform.id))
        .catch(({ message, response }) => {
          if (message) {
            console.log(`Error fetching holders ${message}; Chain ${platform.chain_uid}; Platform ${platform.type}`)
          }

          if (response && response.status === 429) {
            logger.error('Sleeping 15sec')
            return utils.sleep(15000)
          }
        })

      await utils.sleep(1000)
    }
  }

  async getAccounts(scan) {
    const data = await scan.getUniqueAddress()
    const records = csv.parse(data)

    let total = null
    if (records) {
      const record = records[records.length - 1]
      if (record) {
        total = record[record.length - 1]
      }
    }

    const accounts = await scan.getAccounts()
    return [total, accounts]
  }

  mapBlockchairData(platformId, chain) {
    return ({ context, data }) => {
      let supply = 21000000

      if (chain === 'dash') {
        supply = 18920000
      } else if (chain === 'litecoin') {
        supply = 84000000
      } else if (chain === 'dogecoin') {
        supply = 132670764299
      }

      const items = data.map(item => ({
        balance: item.balance * 0.00000001,
        address: item.address,
        percentage: ((item.balance * 0.00000001) * 100) / supply,
        platform_id: platformId
      }))

      return {
        items,
        total: context.total_rows
      }
    }
  }

  mapHoldersData(addressItem, quantityItem, percentageItem, platformId) {
    try {
      const addressHref = addressItem.find('a').attr('href')

      let address
      if (addressHref) {
        const { pathname } = new URL(addressHref, 'https://domain.com')
        const parts = pathname.split('/')
        if (parts) {
          address = parts[parts.length - 1]
        }
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

  mapChainHolders(platformId) {
    return ([total, data]) => {
      const $ = cheerio.load(data)
      const items = $('table>tbody>tr')
        .filter(i => i < 10)
        .map((i, item) => {
          return this.mapHoldersData(
            $(item.children[1]),
            $(item.children[3]),
            $(item.children[4]),
            platformId
          )
        })
        .toArray()
        .filter(i => i)

      return {
        items,
        total
      }
    }
  }

  mapTokenHolders(platformId) {
    return data => {
      const $ = cheerio.load(data)
      const total = $('.card .card-header').text().trim()
      const items = $('table>tbody>tr').map((i, item) => {
        return this.mapHoldersData(
          $(item.children[1]),
          $(item.children[2]),
          $(item.children[3]),
          platformId
        )
      }).toArray().filter(i => i)

      return {
        items,
        total: this.normalizeNumber(total.split('Total Token Holders: ')[1])
      }
    }
  }

  mapSolanaHolders() {
    return ([data, token]) => {
      const items = data.result.map(holder => {
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
          percentage: (balance * 100) / supply
        }
      }).filter(i => i)

      return {
        items,
        total: data.total
      }
    }
  }

  normalizeNumber(string) {
    if (!string) return ''
    return string.replace(',', '')
  }

  async upsert({ total, items: holders }, platformId) {
    if (!platformId || !holders.length) {
      return
    }

    if (holders.every(h => h.percentage === 0 || h.percentage === '0')) {
      return
    }

    const records = { platform_id: platformId, holders, total }
    await CoinHolderStats.bulkCreate([records], { updateOnDuplicate: ['total', 'holders'] })
      .then(() => {
        console.log('Inserted coin holders', holders.length)
      })
      .catch(err => {
        console.error('Error inserting coin holders', err.message)
      })
  }
}

module.exports = CoinHolderSyncer
