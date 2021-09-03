const axios = require('axios')

const instance = axios.create({
  baseURL: 'https://api.coingecko.com/api/v3',
  timeout: 180000
});

module.exports = {
  getCoinInfo: (uid, language, currency) => {
    const idMap = {
      bitcoin: 'bitcoin',
      ethereum: 'ethereum',
      tether: 'tether'
    }

    const providerId = idMap[uid]

    return instance.get(`/coins/${providerId}?tickers=false&community_data=false&developer_data=false&sparkline=false`)
      .then(resp => {
        const { data } = resp

        return {
          rate: data.market_data.current_price[currency],
          market_cap: data.market_data.market_cap[currency],
          market_cap_rank: data.market_cap_rank,
          circulating_supply: data.market_data.circulating_supply,
          total_supply: data.market_data.total_supply,
          fully_diluted_valuation: data.market_data.fully_diluted_valuation[currency],
          total_volume: data.market_data.total_volume[currency],
          genesis_date: data.genesis_date,
          description: data.description[language],
          links: {
            website: data.links.homepage[0],
            twitter: data.links.twitter_screen_name,
            github: data.links.repos_url.github[0],
            reddit: data.links.subreddit_url,
            telegram: data.links.telegram_channel_identifier
          },
          price_change_percentage_in_currency: {
            usd: {
              '7d': data.market_data.price_change_percentage_7d_in_currency.usd,
              '30d': data.market_data.price_change_percentage_30d_in_currency.usd,
            },
            btc: {
              '7d': data.market_data.price_change_percentage_7d_in_currency.btc,
              '30d': data.market_data.price_change_percentage_30d_in_currency.btc,
            },
            eth: {
              '7d': data.market_data.price_change_percentage_7d_in_currency.eth,
              '30d': data.market_data.price_change_percentage_30d_in_currency.eth,
            },
          },
        }
      })
  }
}
