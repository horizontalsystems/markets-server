const { chunk } = require('lodash')
const Transaction = require('../db/models/Transaction')
const Platform = require('../db/models/Platform')
const bigquery = require('../providers/bigquery')
const bitquery = require('../providers/bitquery')
const Syncer = require('./Syncer')

class TransactionSyncer extends Syncer {

  async start() {
    await this.syncHistorical()
    await this.syncLatest()
  }

  async syncHistorical() {
    if (await Transaction.exists()) {
      return
    }

    await this.syncFromBigquery(this.syncParamsHistorical('1d'), '1d')
    await this.syncFromBigquery(this.syncParamsHistorical('4h'), '4h')
    await this.syncFromBigquery(this.syncParamsHistorical('1h'), '1h')

    await this.syncFromBitquery(this.syncParamsHistorical('1d'), 'bsc')
    await this.syncFromBitquery(this.syncParamsHistorical('1d'), 'solana')
  }

  async syncLatest() {
    this.cron('1h', this.syncDailyStats)
    this.cron('4h', this.syncWeeklyStats)
    this.cron('1d', this.syncMonthlyStats)
  }

  async syncDailyStats(dateParams) {
    await this.syncFromBigquery(dateParams, '1h')
    await this.syncFromBitquery(dateParams, 'bsc', true)
    await this.syncFromBitquery(dateParams, 'solana', true)
  }

  async syncWeeklyStats({ dateFrom, dateTo }) {
    await this.adjustPoints(dateFrom, dateTo)
  }

  async syncMonthlyStats({ dateFrom, dateTo }) {
    await this.adjustPoints(dateFrom, dateTo)
  }

  async adjustPoints(dateFrom, dateTo) {
    await Transaction.updatePoints(dateFrom, dateTo)
    await Transaction.deleteExpired(dateFrom, dateTo)
  }

  async syncFromBigquery({ dateFrom, dateTo }, datePeriod) {
    const platforms = await this.getPlatforms(['ethereum', 'erc20'], true, false)
    const transactions = await bigquery.getTransactionsStats(dateFrom, dateTo, platforms.list, datePeriod)
    const records = transactions.map(transaction => {
      return {
        count: transaction.count,
        volume: transaction.volume,
        date: transaction.date.value,
        platform_id: platforms.map[transaction.address]
      }
    })

    return this.bulkCreate(records)
  }

  async syncFromBitquery(dateParams, network, isHourly) {
    const platforms = await this.getPlatforms(network === 'bsc' ? 'bep20' : network)
    const chunks = chunk(platforms.list, 100)
    const dateFrom = dateParams.dateFrom.slice(0, 10)

    for (let i = 0; i < chunks.length; i += 1) {
      const transfers = await bitquery.getTransfers(dateFrom, chunks[i], network)
      const records = transfers.map(transfer => {
        return {
          count: transfer.count,
          volume: transfer.amount,
          date: transfer.date.startOfInterval,
          platform_id: platforms.map[transfer.currency.address]
        }
      })

      if (isHourly && records.length) {
        await this.adjustHourlyData(records, dateFrom, dateParams.dateFrom)
      } else {
        await this.bulkCreate(records)
      }
    }
  }

  async adjustHourlyData(transfers, dateFrom, date) {
    const transactions = await Transaction.getSummedItems(dateFrom, transfers.map(item => item.platform_id))
    const transactionsMap = transactions.reduce((mapped, item) => ({
      ...mapped,
      [item.platform_id]: {
        count: item.count,
        volume: item.volume
      }
    }), {})

    const records = transfers.map(item => {
      const tx = transactionsMap[item.platform_id]
      if (!tx) {
        return item
      }

      return {
        date,
        count: item.count - tx.count,
        volume: item.volume - tx.volume,
        platform_id: item.platform_id
      }
    })

    return this.bulkCreate(records)
  }

  async getPlatforms(types, withDecimals, withAddress = true) {
    const platforms = await Platform.getByTypes(types, withDecimals, withAddress)
    const list = []
    const map = {}

    platforms.forEach(({ type, address, decimals, id }) => {
      if (type === 'ethereum') {
        map.ethereum = id
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

  bulkCreate(records) {
    const items = records.filter(item => item.platform_id)
    if (!items.length) {
      return
    }

    return Transaction.bulkCreate(items, { ignoreDuplicates: true })
      .then(transactions => {
        console.log('Inserted transactions', transactions.length)
      })
      .catch(e => {
        console.error('Error inserting transactions', e.message, e.stack)
      })
  }

}

module.exports = TransactionSyncer
