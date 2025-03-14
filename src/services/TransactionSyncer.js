const { chunk } = require('lodash')
const { utcDate } = require('../utils')
const { bitquery } = require('../providers/bitquery')
const bigquery = require('../providers/bigquery')
const flipsidecrypto = require('../providers/flipsidecrypto')
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
      await this.syncFromBigquery(this.syncParamsHistorical('1y'), '1d')
    }

    if (!await Transaction.existsForPlatforms('bitcoin')) {
      await this.syncFromBigquery(this.syncParamsHistorical('1y'), '1d', true)
    }

    if (!await Transaction.existsForPlatforms('binance-smart-chain')) {
      await this.syncFromBitquery(this.syncParamsHistorical('1y'), 'binance-smart-chain', false, 30)
    }

    if (!await Transaction.existsForPlatforms('solana')) {
      await this.syncSolana(utcDate({ days: -30 }, 'yyyy-MM-dd'))
    }

    console.log('Completed syncing historical transactions stats')
  }

  async syncLatest() {
    this.cron('1d', this.syncDailyStats)
    this.cron('01:00', this.syncDailyStats)
    this.cron('01:00', () => this.syncSolana(utcDate({ days: -1 }, 'yyyy-MM-dd')))
  }

  async syncDailyStats({ dateFrom, dateTo }) {
    const params = {
      dateFrom: utcDate({ days: -1 }, 'yyyy-MM-dd'),
      dateTo: utcDate()
    }

    await this.syncFromBigquery(params, '1d')
    await this.syncFromBigquery(params, '1d', true)
    await this.syncFromBitquery(params, 'binance-smart-chain', false)

    await Transaction.deleteExpired(dateFrom, dateTo)

    console.log('Completed syncing daily transactions stats')
  }

  async syncSolana(dateFrom) {
    const platforms = await this.getPlatformsWithPrice('solana')
    const platformsStr = platforms.list.map(item => `('${item.address}')`).join(',')

    const query = `
      WITH tokens AS (SELECT address FROM (VALUES ${platformsStr}) t(address))
      SELECT
        mint as address,
        DATE (block_timestamp) AS transfer_date,
        COUNT(*) AS transfer_count,
        SUM (amount) AS transfer_amount
       FROM solana.core.fact_transfers, tokens
      WHERE mint = tokens.address
        AND block_timestamp >= '${dateFrom}'
      GROUP BY transfer_date, mint
      ORDER BY transfer_date DESC, mint`

    const items = await flipsidecrypto.runQuery(query, '440ebb4b-2b0f-4d4e-a3b3-a5c79480c416')
    const recs = items.map(item => {
      const platform = platforms.map[item.address] || {}
      const price = platform.price || 1
      return {
        date: item.transfer_date,
        count: item.transfer_count,
        volume: item.transfer_amount * price,
        platform_id: platform.id
      }
    })

    await this.bulkCreate(recs, 'solana')
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
        platform_id: platforms.map[transaction.address]
      }
    })

    await this.bulkCreate(records, 'ethereum,erc20,btc')
  }

  async syncFromBitquery(dateParams, chain, isHourly, chunkSize = 100) {
    const platforms = await this.getPlatforms(chain, false, false)
    const chunks = chunk(platforms.list, chunkSize)
    const dateFrom = dateParams.dateFrom.slice(0, 10)
    const storeData = async recs => {
      if (isHourly && recs.length) {
        await this.adjustHourlyData(recs, dateFrom, dateParams.dateFrom, chain)
      } else {
        await this.bulkCreate(recs, chain)
      }
    }

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

      await storeData(records)
    }

    const transactions = await bitquery.getTransactions(dateFrom, chain)
    const records = transactions.map(transfer => {
      return {
        count: transfer.count,
        volume: transfer.amount,
        date: transfer.date.startOfInterval,
        platform_id: platforms.map[chain]
      }
    })

    await storeData(records)
  }

  async adjustHourlyData(transfers, dateFrom, date, network) {
    const items = transfers.filter(item => item.date === dateFrom)
    const transactions = await Transaction.getSummedItems(dateFrom, items.map(item => item.platform_id))
    const transactionsMap = transactions.reduce((mapped, item) => ({
      ...mapped,
      [item.platform_id]: {
        count: item.count,
        volume: item.volume
      }
    }), {})

    const records = items.map(item => {
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

  async showPlatforms(chain) {
    const platforms = await this.getPlatforms(chain, true, false)
    const platformsStr = platforms.list
      .map(item => {
        return `('${item.address}')`
      })
      .join(',')

    console.log(platformsStr)
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

  async getPlatformsWithPrice(chain, uids) {
    const platforms = await Platform.getByChainWithPrice(chain, uids)
    const list = []
    const map = {}

    platforms.forEach(({ id, address, decimals, price }) => {
      if (address) {
        map[address] = { id, price }
        list.push({ address, decimals })
      }
    })

    return { list, map }
  }

  async bulkCreate(records, chain) {
    const items = records.filter(item => item.platform_id && item.volume > 0)
    if (!items.length) {
      return
    }

    const chunks = chunk(items, 300000)

    for (let i = 0; i < chunks.length; i += 1) {
      await Transaction.bulkCreate(chunks[i], { updateOnDuplicate: ['count', 'volume'] })
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
