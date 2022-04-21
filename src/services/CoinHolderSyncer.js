/* eslint-disable no-param-reassign */
const cheerio = require('cheerio')
const blockchair = require('../providers/blockchair')
const etherscan = require('../providers/etherscan')
const snowtrace = require('../providers/snowtrace')
const ftmscan = require('../providers/ftmscan')
const bscscan = require('../providers/bscscan')
const solscan = require('../providers/solscan')
const Platform = require('../db/models/Platform')
const CoinHolder = require('../db/models/CoinHolder')
const Syncer = require('./Syncer')
const utils = require('../utils')
const logger = require('../config/logger')

class CoinHolderSyncer extends Syncer {
  async start() {
    await this.syncAll()
    await this.syncLatest()
  }

  async syncAll() {
    const platforms = await Platform.getByTypes(null, false, false)
    await this.syncHolders(platforms)
  }

  async sync(uids) {
    const platforms = await Platform.findByCoinUID(uids)
    await this.syncHolders(platforms)
  }

  async syncLatest() {
    this.cron('0 0 */10 * *', this.syncMonthly) // every 10 days
  }

  syncMonthly() {
    return this.syncAll()
  }

  async syncHolders(platforms) {
    console.log(`Platforms to sync ${platforms.length}`)

    const resolve = (request, mapper) => request.then(mapper)
    const fetcher = ({ id, type, address }) => {
      switch (type) {
        case 'bitcoin':
        case 'bitcoin-cash':
        case 'dash':
        case 'dogecoin':
        case 'litecoin':
        case 'zcash':
          return resolve(blockchair.getAddresses(type), this.mapBlockchairData(id, type))
        case 'ethereum':
          return resolve(etherscan.getAccounts(), this.mapChainHolders(id))
        case 'binance-smart-chain':
          return resolve(bscscan.getAccounts(), this.mapChainHolders(id))
        case 'erc20':
          return resolve(etherscan.getHolders(address), this.mapTokenHolders(id))
        case 'bep20':
          return resolve(bscscan.getHolders(address), this.mapTokenHolders(id))
        case 'avalanche':
          return address
            ? resolve(snowtrace.getHolders(address), this.mapTokenHolders(id))
            : resolve(snowtrace.getAccounts(), this.mapChainHolders(id))
        case 'fantom':
          return address
            ? resolve(ftmscan.getHolders(address), this.mapTokenHolders(id))
            : resolve(ftmscan.getAccounts(), this.mapChainHolders(id))
        case 'solana': {
          const requests = [
            solscan.getHolders(address),
            solscan.getTokenInfo(address)
          ]

          return resolve(Promise.all(requests), this.mapSolanaHolders(id))
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

      console.log(`Fetching major holders for ${platform.type} ${platform.address} (${i})`)

      await request
        .then(data => this.upsert(data, platform.id))
        .catch(({ message, response }) => {
          if (message) {
            console.log(`Error fetching holders ${message}; Platform ${platform.type}`)
          }

          if (response && response.status === 429) {
            logger.error('Sleeping 15sec')
            return utils.sleep(15000)
          }
        })

      await utils.sleep(1000)
    }
  }

  mapBlockchairData(platformId, type) {
    return data => {
      let supply = 21000000

      if (type === 'dash') {
        supply = 18920000
      } else if (type === 'litecoin') {
        supply = 84000000
      } else if (type === 'dogecoin') {
        supply = 132670764299
      }

      return data.map(item => ({
        balance: item.balance * 0.00000001,
        address: item.address,
        percentage: ((item.balance * 0.00000001) * 100) / supply,
        platform_id: platformId
      }))
    }
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

  mapChainHolders(platformId) {
    return data => {
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
  }

  mapTokenHolders(platformId) {
    return data => {
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
  }

  mapSolanaHolders(platformId) {
    return ([data, token]) => {
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
  }

  async upsert(holders, platformId) {
    if (!platformId || !holders.length) {
      return
    }

    if (holders.every(h => h.percentage === 0 || h.percentage === '0')) {
      return
    }

    await CoinHolder.deleteAll(platformId)
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
