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
    if (!await Transaction.existsForPlatforms('ethereum')) {
      await this.syncFromBigquery(this.syncParamsHistorical('1d', { days: -30 }), '1d')
      await this.syncFromBigquery(this.syncParamsHistorical('30m'), '30m')
    }

    if (!await Transaction.existsForPlatforms('bitcoin')) {
      await this.syncFromBigquery(this.syncParamsHistorical('1d', { days: -30 }), '1d', true)
      await this.syncFromBigquery(this.syncParamsHistorical('30m'), '30m', true)
    }

    if (!await Transaction.existsForPlatforms('binance-smart-chain')) {
      await this.syncFromBitquery(this.syncParamsHistorical('1d'), 'binance-smart-chain', false, 30)
    }

    if (!await Transaction.existsForPlatforms('solana')) {
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
    await this.syncFromBitquery(dateParams, 'binance-smart-chain', true)
    await this.syncFromBitquery(dateParams, 'solana', true, 30)

    console.log('Completed syncing daily transactions stats')
  }

  async syncMonthlyStats({ dateFrom, dateTo }) {
    await Transaction.updatePoints(dateFrom, dateTo)
    await Transaction.deleteExpired(dateFrom, dateTo)
  }

  async syncFromBigquery({ dateFrom, dateTo }, datePeriod, isBtcBaseCoins = false) {
    const chains = ['bitcoin', 'bitcoin-cash', 'dash', 'dogecoin', 'litecoin', 'zcash', 'ethereum']
    const platforms = await this.getPlatforms(chains, true, false)
    const transactions = isBtcBaseCoins
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

  async syncFromBitquery(dateParams, chain, isHourly, chunkSize = 100) {
    const platforms = await this.getPlatforms(chain)
    const chunks = chunk(platforms.list, chunkSize)
    const dateFrom = dateParams.dateFrom.slice(0, 10)

    for (let i = 0; i < chunks.length; i += 1) {
      const transfers = await bitquery.getTransfers(dateFrom, chunks[i], chain)
      const records = transfers.map(transfer => {
        return {
          count: transfer.count,
          volume: transfer.amount,
          date: transfer.date.startOfInterval,
          platform_id: platforms.map[transfer.currency.address]
        }
      })

      if (isHourly && records.length) {
        await this.adjustHourlyData(records, dateFrom, dateParams.dateFrom, chain)
      } else {
        await this.bulkCreate(records, chain)
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

  async getPlatforms(chains, withDecimals, withAddress = true) {
    const platforms = await Platform.getByChain(chains, withDecimals, withAddress)
    const list = []
    const map = {}

    platforms.forEach(({ id, type, chain_uid: chain, address, decimals }) => {
      if (type === 'native') {
        map[chain] = id
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

  async bulkCreate(records, chain) {
    const items = records.filter(item => item.platform_id)
    if (!items.length) {
      return
    }

    const chunks = chunk(items, 300000)

    for (let i = 0; i < chunks.length; i += 1) {
      await Transaction.bulkCreate(chunks[i], { ignoreDuplicates: true })
        .then(transactions => {
          console.log(`Inserted ${chain} transactions`, transactions.length)
        })
        .catch(e => {
          console.error('Error inserting transactions', e.message, e.stack)
        })
    }
  }

}

module.exports = TransactionSyncer
