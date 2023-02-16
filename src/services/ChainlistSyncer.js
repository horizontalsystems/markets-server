const { isString } = require('lodash')
const { sleep } = require('../utils')
const chainlist = require('../providers/chainlist')
const coingecko = require('../providers/coingecko')
const Chain = require('../db/models/Chain')
const Platform = require('../db/models/Platform')
const Web3EvmProvider = require('../providers/Web3EvmProvider')

class ChainlistSyncer {
  async sync() {
    const map = this.chainIdsMap()
    const chains = await chainlist.getChains()
    const chainsMainnet = chains.filter(chain => {
      return !this.isTestnet(chain.name) && !this.isTestnet(chain.title) && !this.isTestnet(chain.network)
    })

    for (let i = 0; i < chainsMainnet.length; i += 1) {
      const item = chainsMainnet[i]
      const platform = await this.getPlatform(map[item.chainId])
      await this.storeChain(item, platform)
    }

    console.log(`${chainsMainnet.length} chains updated`)
  }

  async syncChains(uid) {
    const chains = await Chain.findAll({
      attributes: ['uid', 'evm'],
      where: {
        ...(uid && { uid }),
        evm: Chain.literal('evm IS NOT NULL'),
      }
    })

    const chainsMainnet = chains.filter(item => !item.evm.isTestnet)

    for (let i = 0; i < chainsMainnet.length; i += 1) {
      const chain = chainsMainnet[i]
      const platforms = await Platform.findAll({
        where: {
          chain_uid: chain.uid,
          decimals: Platform.literal('decimals IS NULL')
        }
      })

      await this.syncPlatforms(platforms, chain)
    }

    console.log(`${chainsMainnet.length} chains synced`)
  }

  getProviders({ chainId, rpc }) {
    const extra = chainlist.extraRpcs[chainId]

    let rpcs = []
    if (extra && extra.rpcs && extra.rpcs.length) {
      rpcs = extra.rpcs
        .map(item => (isString(item) ? item : item.url))
        .filter(item => item.startsWith('https'))
    }

    return (rpcs.length ? rpcs : rpc).map(url => new Web3EvmProvider(url))
  }

  async syncPlatforms(platforms, { uid, evm }) {
    if (!evm || !evm.rpc || !evm.rpc.length) {
      console.log('No prc provided for', uid)
      return
    }

    let activeProvider
    const providers = this.getProviders(evm)
    const getDecimals = async address => {
      if (activeProvider) {
        return activeProvider.getDecimals(address)
      }

      for (let i = 0; i < providers.length; i += 1) {
        const provider = providers[i];

        try {
          const decimals = await provider.getDecimals(address)

          if (parseInt(decimals, 10)) {
            activeProvider = provider
            return decimals
          }
        } catch (e) {
          console.log(e.message)
        }
      }
    }

    console.log(`Fetching decimals for ${uid}; platforms: ${platforms.length}; rpc: ${providers.length}`)

    for (let i = 0; i < platforms.length; i += 1) {
      const platform = platforms[i]

      if (platform.type === 'native' || (platform.type === uid && !platform.address)) {
        console.log(`Update native decimals: ${evm.nativeCurrency.decimals}`)
        await platform.update({ type: 'native', decimals: evm.nativeCurrency.decimals })
          .catch(e => console.log(e.message))
        continue
      }

      if (!platform.address || platform.type === 'bep2') {
        continue
      }

      try {
        const decimals = await getDecimals(platform.address)
        console.log(`Update decimals: ${decimals} address: ${platform.address}`)
        await platform.update({ type: 'eip20', decimals })
      } catch (e) {
        await platform.update({ type: 'eip20' })
        console.log(e)
      }
    }
  }

  async storeChain(chain, platform) {
    const values = {
      uid: platform ? platform.uid : chain.name.toLowerCase().split(' ').join('-'),
      name: chain.name,
      evm: {
        nativeCurrency: chain.nativeCurrency,
        rpc: chain.rpc,
        chainId: chain.chainId,
        explorers: chain.explorers,
        isTestnet: this.isTestnet(chain.name) || this.isTestnet(chain.title) || this.isTestnet(chain.network)
      }
    }

    return Chain.bulkCreate([values], { updateOnDuplicate: ['evm'] })
      .then(([record]) => {
        console.log(`Updated ${record.name}`)
      })
      .catch(console.error)
  }

  async getPlatform(uid) {
    if (!uid) return null

    const platforms = await Platform.query(`
      SELECT
        c.uid, p.type, p.chain_uid
      FROM coins c
      LEFT JOIN platforms p on p.coin_id = c.id
       AND (p.type = 'native' or p.type = c.uid)
      WHERE c.uid = :uid
    `, { uid })

    let platform = platforms.find(p => p.chain_uid === uid)
    if (!platform) {
      [platform] = platforms
    }

    return platform
  }

  async fetchInfo(id, info) {
    if (typeof info === 'object') {
      console.log('Fetching', info.name, info.shortName)
      let data = await coingecko.search(info.name)
      if (!data) {
        data = await coingecko.search(info.shortName)
      }
      console.log(data)
      await sleep(4000)
    }
  }

  isTestnet(string) {
    if (!string) return false
    const item = string.toLowerCase()
    return item.includes('test') || item.includes('devnet')
  }

  chainIdsMap() {
    return {
      1: 'ethereum',
      2: 'expanse',
      8: 'ubiq',
      10: 'optimistic-ethereum',
      11: 'metadium',
      14: 'flare-networks',
      19: 'songbird',
      22: 'elastos',
      24: 'kardiachain',
      25: 'crypto-com-chain',
      30: 'rootstock',
      36: 'dxchain',
      38: 'radium',
      40: 'telos',
      46: 'darwinia-network-native-token',
      50: 'xdc',
      52: 'coinex-token',
      55: 'zyx',
      56: 'binancecoin',
      57: 'syscoin',
      58: 'ong',
      // 59: 'eos',
      60: 'gochain',
      61: 'ethereum-classic',
      66: 'oec-token',
      70: 'hoo-token',
      73: 'fncy',
      75: 'decimal',
      77: 'poa-network',
      79: 'zenith-chain',
      82: 'meter',
      86: 'gatechain-token',
      87: 'supernova',
      88: 'tomochain',
      99: 'poa-network',
      100: 'gnosis',
      101: 'etherinc',
      106: 'velas',
      108: 'thunder-token',
      111: 'etherlite-2',
      122: 'fuse-network-token',
      128: 'huobi-token',
      137: 'matic-network',
      163: 'lightstreams',
      168: 'aioz-network',
      180: 'amepay',
      186: 'seele',
      193: 'crypto-emergency',
      199: 'bittorrent',
      200: 'xdaiarb',
      211: 'freight-trust-network',
      222: 'permission-coin',
      246: 'energy-web-token',
      248: 'oasys',
      250: 'fantom',
      269: 'high-performance-blockchain',
      288: 'boba-network',
      311: 'omax-token',
      314: 'filecoin',
      321: 'kucoin-shares',
      324: 'zksync-2',
      336: 'shiden',
      361: 'theta-token',
      416: 'sx',
      512: 'acute-angle-cloud',
      534: 'candle',
      592: 'astar',
      686: 'karura',
      787: 'acala',
      813: 'qitmeer-network',
      820: 'callisto',
      841: 'taraxa',
      877: 'dexit-finance',
      888: 'wanchain',
      1000: 'gton-capital',
      1010: 'evrice',
      1012: 'newton-project',
      1022: 'sakura',
      1024: 'clover-finance',
      1030: 'conflux-token',
      1088: 'metis-token',
      1130: 'defichain',
      1139: 'math',
      1229: 'exzo',
      1231: 'ultron',
      1280: 'halo-network',
      1284: 'moonbeam',
      1285: 'moonriver',
      1288: 'moonrock-v2',
      1455: 'crypto-tex',
      1618: 'catecoin',
      1620: 'atheios',
      1657: 'bata',
      1818: 'cube-network',
      1856: 'teslafunds',
      1881: 'gitshock-finance',
      1987: 'ethergem',
      1994: 'ekta-2',
      2000: 'dogechain',
      2021: 'edgeware',
      2025: 'rangers-protocol-gas',
      2109: 'exosama-network',
      2151: 'bosagora',
      2152: 'findora',
      2213: 'evanesco-network',
      2222: 'kava',
      2569: 'techpay',
      2611: 'redlight-chain',
      3001: 'centrality',
      3031: 'orlando-chain',
      3400: 'paribu-net',
      3501: 'jfin-coin',
      3601: 'pando-token',
      3912: 'drac-network',
      3999: 'yuan-chain-coin',
      4444: 'htmlcoin',
      4689: 'iotex',
      5177: 'tlchain',
      5197: 'era-swap-token',
      5551: 'nahmii',
      6626: 'pixie',
      6969: 'tombchain',
      7341: 'shyft-network-2',
      7700: 'canto',
      8080: 'shardeum',
      8081: 'shardeum',
      8217: 'klay-token',
      8881: 'quartz',
      8898: 'mammoth-mmt',
      8989: 'giant-mammoth',
      9001: 'evmos',
      9012: 'berylbit',
      10248: '0xtrade',
      10823: 'cryptocoinpay',
      10946: 'quadrans',
      11888: 'santiment-network-token',
      13308: 'credit',
      13381: 'phoenix',
      18159: 'proof-of-memes-pomchain',
      21337: 'centrality',
      21816: 'omchain',
      24484: 'webchain',
      26600: 'hertz-network',
      32520: 'bitrise-token',
      32659: 'fsn',
      39797: 'energi',
      39815: 'oho-blockchain',
      42161: 'arbitrum',
      42170: 'arb-nova',
      42220: 'celo',
      42262: 'oasis-network',
      43114: 'avalanche-2',
      45000: 'autobahn-network',
      47805: 'rei-network',
      55555: 'reichain',
      61916: 'doken',
      62621: 'multivac',
      63000: 'ecredits',
      71402: 'godwoken',
      88888: 'ivar-coin',
      100000: 'quark-chain',
      200625: 'akroma',
      210425: 'platon-network',
      256256: 'caduceus',
      333999: 'polis',
      381931: 'metal-blockchain',
      420420: 'kekchain',
      432204: 'dexalot',
      888888: 'vision',
      2099156: 'pchain',
      14288640: 'anduschain',
      20180430: 'smartmesh',
      22052002: 'excelon',
      28945486: 'auxilium',
      35855456: 'joys',
      61717561: 'aquachain',
      192837465: 'gather',
      311752642: 'one-ledger',
      1313161554: 'aurora-near',
      1666600000: 'harmony',
      11297108109: 'palm'
    }
  }
}

module.exports = ChainlistSyncer
