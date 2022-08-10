const Syncer = require('./Syncer')
const Platform = require('../db/models/Platform')
const getCSupplies = require('../providers/csupply')
const bscscan = require('../providers/bscscan')
const { sleep } = require('../utils')

class CoinCirculatingSupplySyncer extends Syncer {

  async sync(uids) {
    const map = {}
    const platforms = await Platform.getMarketCap(uids)
    const platformsBep20 = platforms.filter(p => p.chain_uid === 'binance-smart-chain' && p.multi_chain_id && p.decimals)
    const supplies = await getCSupplies()

    const setCSupply = platform => {
      switch (platform.uid) {
        case 'tether':
        case 'usd-coin': {
          const supply = supplies[platform.uid] || {}
          if (supply[platform.uid]) {
            map[platform.id] = supply[platform.uid]
          }
          break
        }
        case 'stepn':
          if (platform.type === 'solana') {
            map[platform.id] = platform.csupply
          }
          break
        default:
          if (platform.type === 'eip20') {
            map[platform.id] = platform.csupply
          }
      }
    }

    for (let i = 0; i < platforms.length; i += 1) {
      const platform = platforms[i]

      if (!platform.csupply) {
        continue
      }

      if (platform.multi_chain_id) {
        setCSupply(platform)
      } else {
        map[platform.id] = platform.csupply
      }
    }

    for (let i = 0; i < platformsBep20.length; i += 1) {
      const platform = platformsBep20[i]
      const supplyStr = await bscscan.getCSupply(platform.address)
      if (supplyStr) {
        const supply = supplyStr / (10 ** platform.decimals)
        if (supply) {
          map[platform.id] = supply
        }
      }
      await sleep(1500)
    }

    await Platform.updateCSupplies(Object.entries(map))
      .then(() => {
        console.log('Updated platforms circulating supplies')
      })
      .catch(e => {
        console.log(e)
      })
  }

}

module.exports = CoinCirculatingSupplySyncer
