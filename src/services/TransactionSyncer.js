const { chunk } = require('lodash')
const { bitquery } = require('../providers/bitquery')
const bigquery = require('../providers/bigquery')
const Transaction = require('../db/models/Transaction')
const Platform = require('../db/models/Platform')
const Syncer = require('./Syncer')

class TransactionSyncer extends Syncer {

  async start() {
    await this.syncHistorical()
    await this.syncLatest()
  }

  async syncHistorical() {
    if (!await Transaction.existsForPlatforms(['ethereum', 'erc20'])) {
      await this.syncFromBigquery(this.syncParamsHistorical('1d', { days: -30 }), '1d')
      await this.syncFromBigquery(this.syncParamsHistorical('30m'), '30m')
    }

    if (!await Transaction.existsForPlatforms(['bitcoin'])) {
      await this.syncFromBigquery(this.syncParamsHistorical('1d', { days: -30 }), '1d', true)
      await this.syncFromBigquery(this.syncParamsHistorical('30m'), '30m', true)
    }

    if (!await Transaction.existsForPlatforms(['bep20'])) {
      await this.syncFromBitquery(this.syncParamsHistorical('1d'), 'bsc', false, 30)
    }

    if (!await Transaction.existsForPlatforms(['solana'])) {
      await this.syncFromBitquery(this.syncParamsHistorical('1d'), 'solana', false, 30)
    }

    console.log('Completed syncing historical transactions stats')
  }

  async syncLatest() {
    this.cron('30m', this.syncDailyStats)
    this.cron('1d', this.syncMonthlyStats)
  }

  async syncDailyStats(dateParams) {
    await this.syncFromBigquery(dateParams, '30m')
    await this.syncFromBigquery(dateParams, '30m', true)
    await this.syncFromBitquery(dateParams, 'bsc', true)
    await this.syncFromBitquery(dateParams, 'solana', true)

    console.log('Completed syncing daily transactions stats')
  }

  async syncMonthlyStats({ dateFrom, dateTo }) {
    await Transaction.updatePoints(dateFrom, dateTo)
    await Transaction.deleteExpired(dateFrom, dateTo)
  }

  async syncFromBigquery({ dateFrom, dateTo }, datePeriod, syncBtcBaseCoins = false) {
    const types = ['bitcoin', 'bitcoin-cash', 'dash', 'dogecoin', 'litecoin', 'zcash', 'ethereum', 'erc20']
    const platforms = await this.getPlatforms(types, true, false)
    const transactions = syncBtcBaseCoins
      ? await bigquery.getTransactionsStatsBtcBased(dateFrom, dateTo, datePeriod)
      : await bigquery.getTransactionsStats(dateFrom, dateTo, platforms.list, datePeriod)

    const records = transactions.map(transaction => {
      return {
        count: transaction.count,
        volume: transaction.volume,
        date: transaction.date.value,
        platform_id: platforms.map[transaction.address || transaction.platform]
      }
    })

    await this.bulkCreate(records, 'ethereum,erc20,btc')
  }

  async syncFromBitquery(dateParams, network, isHourly, chunkSize = 100) {
    const platforms = await this.getPlatforms(network === 'bsc' ? 'bep20' : network)
    const chunks = chunk(platforms.list, chunkSize)
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
        await this.adjustHourlyData(records, dateFrom, dateParams.dateFrom, network)
      } else {
        await this.bulkCreate(records, network)
      }
    }
  }

  async adjustHourlyData(transfers, dateFrom, date, network) {
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

    return this.bulkCreate(records, network)
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

  async bulkCreate(records, platform) {
    const items = records.filter(item => item.platform_id)
    if (!items.length) {
      return
    }

    const chunks = chunk(items, 400000)

    for (let i = 0; i < chunks.length; i += 1) {
      await Transaction.bulkCreate(chunks[i], { ignoreDuplicates: true })
        .then(transactions => {
          console.log(`Inserted ${platform} transactions`, transactions.length)
        })
        .catch(e => {
          console.error('Error inserting transactions', e.message, e.stack)
        })
    }
  }

}

module.exports = TransactionSyncer
