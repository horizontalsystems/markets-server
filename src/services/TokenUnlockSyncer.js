const { DateTime } = require('luxon')
const Syncer = require('./Syncer')
const Coin = require('../db/models/Coin')
const TokenUnlock = require('../db/models/TokenUnlock')
const chainbroker = require('../providers/chainbroker')
const cryptorank = require('../providers/cryptorank')
const utils = require('../utils')

class TokenUnlockSyncer extends Syncer {
  async start() {
    this.cron('4h', this.sync)
  }

  async sync() {
    await this.syncFromCryptorank(0, 100)
  }

  async syncFromCryptorank(skip, limit) {
    const unlocks = await cryptorank.getUnlocks(skip, limit)

    await this.storeCryptorankData(unlocks)

    if (unlocks.length < 100) {
      return
    }

    return this.syncFromCryptorank(skip + limit, limit)
  }

  async syncFromChainbroker(page) {
    const { results: unlocks, ...rest } = await chainbroker.getUnlocks(page)

    await this.storeChainbrokerData(unlocks)
    await utils.sleep(100)

    console.log('Fetched unlocks ', { page: rest.page_number, pages: rest.total_pages })

    if (rest.page_number >= rest.total_pages) {
      return
    }

    return this.syncFromChainbroker(rest.page_number + 1)
  }

  async storeCryptorankData(unlocks) {
    for (let i = 0; i < unlocks.length; i += 1) {
      const item = unlocks[i]
      const symbol = item.symbol.toLowerCase()
      const record = {
        coin_uid: this.mapCoinUid(symbol, item.key),
        circulation: item.circulatingSupply,
        locked: item.lockedTokens,
        locked_percent: item.lockedTokensPercent,
        unlocked: item.unlockedTokens,
        unlocked_percent: item.unlockedTokensPercent,
        next_unlock: item.nextUnlocks,
        next_unlock_percent: item.nextUnlockPercent,
        date: item.date
      }

      await TokenUnlock.upsert(record).catch(() => this.onRejectUpsert(record, symbol))
    }
  }

  async storeChainbrokerData(unlocks) {
    for (let i = 0; i < unlocks.length; i += 1) {
      const item = unlocks[i]
      const symbol = item.ticker.toLowerCase()
      const record = {
        coin_uid: this.mapCoinUid(symbol, item.slug),
        circulation: item.circulation,
        unlock_amount: item.unlock_amount,
        unlock_value: item.unlock_value,
        round_name: item.round_name,
        date: DateTime.fromFormat(item.next_unlock, 'DD'),
      }

      console.log(record)
    }
  }

  async onRejectUpsert(record, code) {
    const coin = await Coin.query('SELECT uid, code FROM coins WHERE lower(code) = :code', { code })

    console.log('On Reject Upsert', code, record.coin_uid, coin)

    if (!coin || !coin.length || coin.length > 1) return

    await TokenUnlock.upsert({ ...record, coin_uid: coin[0].uid }).catch(e => {
      console.log('Error inserting unlock data', e.message)
    })
  }

  mapCoinUid(symbol, key) {
    switch (symbol) {
      case 'avax':
        return 'avalanche-2'
      case 'titan':
        return 'titanswap'
      case 'nyan':
        return 'nyan'
      case 'sand':
        return 'the-sandbox'
      case 'saga':
        return 'saga-2'
      case 'rbc':
        return 'rubic'
      case 'xai':
        return 'xai-blockchain'
      case 'sca':
        return 'scallop-2'
      case 'alt':
        return 'altlayer'
      case 'game':
        return 'gamestarter'
      case 'dg':
        return 'decentral-games'
      case 'cat':
        return 'catcoin-cash'
      case 'ait':
        return 'ait-protocol'
      case 'blocto':
        return 'blocto-token'
      case 'gpt':
        return 'qna3-ai'
      case 'meld':
        return 'meld-2'
      case 'polis':
        return 'polis'
      case 'shark':
        return 'polyshark-finance'
      case 'jet':
        return 'polis'
      case 'mm':
        return 'metamecha'
      case 'safe':
        return 'safe-coin-2'
      case 'open':
        return 'qredo'
      case 'luna':
        return 'terra-luna-2'
      case 'blt':
        return 'blocto-token'
      default:
        return key
    }
  }
}

module.exports = TokenUnlockSyncer
