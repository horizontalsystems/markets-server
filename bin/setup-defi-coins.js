const defillama = require('../src/providers/defillama')
const sequelize = require('../src/db/sequelize')
const Coin = require('../src/db/models/Coin')

async function start() {
  await sequelize.sync()

  const protocols = await defillama.getProtocols()
  console.log(`Fetched new protocols ${protocols.length}`)

  for (let i = 0; i < protocols.length; i += 1) {
    const protocol = protocols[i]
    if (!protocol || !protocol.gecko_id) {
      continue
    }

    try {
      const [updated] = await Coin.update({
        defillama_id: protocol.slug,
        defi_data: {
          tvl: protocol.tvl,
          tvl_rank: i + 1,
          tvl_change_1h: protocol.change_1h,
          tvl_change_1d: protocol.change_1d,
          tvl_change_7d: protocol.change_7d,
          staking: protocol.staking,
          chains: protocol.chains
        }
      }, {
        where: { uid: protocol.gecko_id }
      })

      console.log(!!updated, `${protocol.gecko_id} = ${protocol.slug}`)
    } catch (e) {
      console.error(e)
    }
  }
}

start()
  .catch(err => {
    console.log(err.stack)
  })
  .finally(() => {
    process.exit(0)
  })
