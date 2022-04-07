/* eslint-disable no-param-reassign */
const { chunk } = require('lodash')
const { DateTime } = require('luxon')
const { sleep } = require('../utils')
const { bitquery } = require('../providers/bitquery')
const bigquery = require('../providers/bigquery')
const Platform = require('../db/models/Platform')
const Address = require('../db/models/Address')
const Syncer = require('./Syncer')
const logger = require('../config/logger')

class AddressSyncer extends Syncer {
  constructor() {
    super()
    this.BUSDT_ADDRESS = '0x55d398326f99059ff775485246999027b3197955'
  }

  async start() {
    await this.syncHistorical()
    await this.syncLatest()
  }

  async syncHistorical() {
    let types = []
    if (!await Address.existsForPlatforms(['ethereum', 'erc20'])) {
      types = ['ethereum', 'erc20']
    }

    if (!await Address.existsForPlatforms(['bitcoin'])) {
      types = types.concat(['bitcoin', 'bitcoin-cash', 'dash', 'dogecoin', 'litecoin', 'zcash'])
    }

    await this.syncStatsFromBigquery(types, this.syncParamsHistorical('1d'), '1d')
    await this.syncStatsFromBigquery(types, this.syncParamsHistorical('30m'), '30m')

    if (!await Address.existsForPlatforms(['bep20'])) {
      await this.syncHistoricalStatsFromBitquery(this.syncParamsHistorical('1d'), 'bsc')
    }

    if (!await Address.existsForPlatforms(['solana'])) {
      await this.syncHistoricalStatsFromBitquery(this.syncParamsHistorical('1d'), 'solana')
    }
  }

  async syncLatest() {
    this.cron('30m', this.syncDailyStats)
    this.cron('1d', this.syncMonthlyStats)
  }

  async syncDailyStats(dateParams) {
    const types = ['bitcoin', 'bitcoin-cash', 'dash', 'dogecoin', 'litecoin', 'zcash', 'ethereum', 'erc20']

    await this.adjustPoints(dateParams.dateFrom, dateParams.dateTo)

    await this.syncStatsFromBigquery(types, dateParams, '30m')
    await this.syncStatsFromBitquery(dateParams, 'bsc', true)
    await this.syncStatsFromBitquery(dateParams, 'solana', true)
  }

  async syncMonthlyStats(dateParams) {
    await this.adjustPoints(dateParams.dateFrom, dateParams.dateTo)
  }

  async adjustPoints(dateFrom, dateTo) {
    await Address.updatePoints(dateFrom, dateTo)
    await Address.deleteExpired(dateFrom, dateTo)
  }

  async syncStatsFromBigquery(types, { dateFrom, dateTo }, timePeriod) {
    try {
      const platforms = await this.getPlatforms(types, true, false)
      let addressStats = []

      if (platforms.map.bitcoin) {
        addressStats = await bigquery.getAddressStatsBtcBased(dateFrom, dateTo, timePeriod)
      }

      if (platforms.map.ethereum || platforms.list.length > 0) {
        addressStats = addressStats.concat(
          await bigquery.getAddressStats(platforms.list, dateFrom, dateTo, timePeriod)
        )
      }

      if (addressStats.length > 0) {
        const result = addressStats.map(data => ({
          count: data.address_count,
          volume: data.volume,
          date: data.block_date.value,
          platform_id: platforms.map[data.coin_address || data.platform]
        }))

        await this.upsertAddressStats(result)
      }

    } catch (e) {
      logger.debug('Error syncing address stats', e)
    }
  }

  async syncHistoricalStatsFromBitquery(dateParams, network) {
    logger.info(`Start syncing historical address stats for network: ${network}`)

    const dateFromStart = DateTime.fromSQL(dateParams.dateFrom)
    let dateTo = DateTime.utc()

    while (dateFromStart <= dateTo) {
      const dateFrom = dateTo.minus({ days: 1 })

      logger.info(`Syncing historical address stats for ${dateFrom} -> ${dateTo}`)

      await this.syncStatsFromBitquery({
        dateFrom: dateFrom.toFormat('yyyy-MM-dd 00:00:00Z'),
        dateTo: dateTo.toFormat('yyyy-MM-dd 00:00:00Z')
      }, network, 50)

      dateTo = dateFrom
    }
  }

  async syncStatsFromBitquery({ dateFrom, dateTo }, network, chunkSize = 20) {
    try {
      const platforms = await this.getPlatforms(network === 'bsc' ? 'bep20' : network)
      const addressStats = []
      const isoDateFrom = DateTime.fromFormat(dateFrom, 'yyyy-MM-dd HH:mm:00Z').toString()
      const isoDateTo = DateTime.fromFormat(dateTo, 'yyyy-MM-dd HH:mm:00Z').toString()
      const chunks = this.getChunks(platforms.list, chunkSize)

      for (let i = 0; i < chunks.length; i += 1) {
        logger.info(`Fetching address stats for chunks: ${i}/${chunks[i].length}`)

        const transfersSenders = await bitquery.getTransferSenders(isoDateFrom, isoDateTo, chunks[i], network)
        const transferReceivers = await bitquery.getTransferReceivers(isoDateFrom, isoDateTo, chunks[i], network)

        const transfers = [...transfersSenders, ...transferReceivers]
        const transfersMap = transfers.reduce((map, { account, currency }) => {
          const mapElement = map[currency.address]

          if (!mapElement) {
            map[currency.address] = [account.address]
          } else if (!mapElement.find(t => t === account.address)) {
            map[currency.address] = [...[account.address], ...mapElement]
          }

          return map
        }, {})

        Object.keys(transfersMap).forEach(coinAddress => {
          addressStats.push({
            date: dateTo,
            volume: 0,
            count: transfersMap[coinAddress].length,
            platform_id: platforms.map[coinAddress]
          })
        })

        sleep(4000) // wait to bypass API limits
      }

      await this.upsertAddressStats(addressStats)
      logger.info(`Successfully synced adddress stats for date: ${dateTo}`)
    } catch (e) {
      logger.debug('Error syncing address stats:', e)
    }
  }

  getChunks(platforms, chunkSize) {
    const newList = platforms.filter(item => item.address !== this.BUSDT_ADDRESS)
    return [...[[{ address: this.BUSDT_ADDRESS }]], ...chunk(newList, chunkSize)]
  }

  async getPlatforms(types, withDecimals, withAddress = true) {
    const platforms = await Platform.getByTypes(types, withDecimals, withAddress)
    const list = []
    const map = {}

    platforms.forEach(({ type, address, decimals, id }) => {
      if (type === 'ethereum' || type === 'bitcoin' || type === 'bitcoin-cash'
      || type === 'dash' || type === 'dogecoin' || type === 'litecoin' || type === 'zcash') {
        map[type] = id
      }

      if (address) {
        map[address] = id

        if (!withDecimals) {
          list.push({ address })
        } else if (decimals) {
          list.push({ address, decimals })
        }
      }
    })

    return { list, map }
  }

  async upsertAddressStats(stats) {
    const chunks = chunk(stats, 400000)

    for (let i = 0; i < chunks.length; i += 1) {
      await Address.bulkCreate(chunks[i], {
        updateOnDuplicate: ['count', 'volume', 'date', 'platform_id']
      })
        .then(([address]) => {
          console.log(JSON.stringify(address.dataValues))
        })
        .catch(err => {
          console.error(err)
        })
    }
  }
}

module.exports = AddressSyncer
